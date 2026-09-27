import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import type { CreatePageViewDto } from './dto/create-page-view.dto.js';
import type { ListPageViewsQueryDto } from './dto/list-page-views-query.dto.js';
import { PageView } from './entities/page-view.entity.js';
import { IpLookupService } from './ip-lookup.service.js';
import { PAGE_VIEW_RETENTION_DAYS } from './page-views.constants.js';

const DAY_MS = 24 * 60 * 60 * 1000;

// Public routes, as the browser's address bar shows them. On blog.* the
// Blog lives at the root (web-client's proxy.ts rewrite); everywhere else
// (apex, and localhost in dev) it's under /blog.
const BLOG_HOST_PATH = /^\/(?:[a-z0-9-]+)?$/;
const SITE_HOST_PATH = /^\/(?:blog(?:\/[a-z0-9-]+)?)?$/;

export interface PageViewList {
  items: PageView[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PageViewSummary {
  days: number;
  totals: { pageViews: number; uniqueIps: number };
  perDay: { day: string; count: number }[];
  topPages: { host: string; path: string; count: number }[];
  topReferrers: { host: string; count: number }[];
  topNetworks: { asnOrg: string | null; country: string | null; count: number; uniqueIps: number }[];
}

function truncate(value: string | undefined | null, max: number): string | null {
  if (!value) return null;
  return value.length > max ? value.slice(0, max) : value;
}

@Injectable()
export class PageViewsService {
  private readonly logger = new Logger(PageViewsService.name);
  // Hosts a Page View may come from — the same list main.ts allows for
  // CORS, as bare "host[:port]" strings.
  private readonly siteHosts: Set<string>;

  constructor(
    @InjectRepository(PageView) private readonly pageViews: Repository<PageView>,
    private readonly ipLookup: IpLookupService,
    config: ConfigService,
  ) {
    this.siteHosts = new Set(
      config
        .get<string>(
          'CORS_ORIGIN',
          'https://alisonrafael.me,https://www.alisonrafael.me,https://blog.alisonrafael.me',
        )
        .split(',')
        .map((origin) => this.hostOf(origin.trim()))
        .filter((host): host is string => host !== null),
    );
  }

  async record(dto: CreatePageViewDto, origin: string | undefined, ip: string, userAgent: string | undefined) {
    const host = origin ? this.hostOf(origin) : null;
    if (!host || !this.siteHosts.has(host)) throw new BadRequestException('Unknown origin.');

    const pathPattern = host.startsWith('blog.') ? BLOG_HOST_PATH : SITE_HOST_PATH;
    if (!pathPattern.test(dto.path)) throw new BadRequestException('Not a public page.');

    // Express reports IPv4 clients on a dual-stack socket as ::ffff:a.b.c.d.
    const normalizedIp = ip.replace(/^::ffff:(?=\d+\.\d+\.\d+\.\d+$)/, '');
    await this.pageViews.insert({
      host,
      path: dto.path,
      referrer: truncate(dto.referrer, 1024),
      userAgent: truncate(userAgent, 512),
      ip: normalizedIp,
      ...this.ipLookup.lookup(normalizedIp),
    });
  }

  async list(query: ListPageViewsQueryDto): Promise<PageViewList> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    const qb = this.pageViews
      .createQueryBuilder('pv')
      .where('pv.createdAt >= :since', { since: this.since(query.days ?? 7) })
      .orderBy('pv.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);
    if (query.host) qb.andWhere('pv.host = :host', { host: query.host });
    if (query.path) qb.andWhere('pv.path LIKE :path', { path: `${this.escapeLike(query.path)}%` });
    if (query.ip) qb.andWhere('pv.ip = :ip', { ip: query.ip });

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, pageSize };
  }

  async summary(days: number): Promise<PageViewSummary> {
    const since = this.since(days);
    const base = () => this.pageViews.createQueryBuilder('pv').where('pv.createdAt >= :since', { since });

    const [totals, perDay, topPages, referrers, topNetworks] = await Promise.all([
      base()
        .select('COUNT(*)', 'pageViews')
        .addSelect('COUNT(DISTINCT pv.ip)', 'uniqueIps')
        .getRawOne<{ pageViews: string; uniqueIps: string }>(),
      base()
        .select("DATE_FORMAT(pv.createdAt, '%Y-%m-%d')", 'day')
        .addSelect('COUNT(*)', 'count')
        .groupBy('day')
        .orderBy('day', 'ASC')
        .getRawMany<{ day: string; count: string }>(),
      base()
        .select('pv.host', 'host')
        .addSelect('pv.path', 'path')
        .addSelect('COUNT(*)', 'count')
        .groupBy('pv.host')
        .addGroupBy('pv.path')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany<{ host: string; path: string; count: string }>(),
      base()
        .select('pv.referrer', 'referrer')
        .addSelect('COUNT(*)', 'count')
        .andWhere("pv.referrer IS NOT NULL AND pv.referrer <> ''")
        .groupBy('pv.referrer')
        .orderBy('count', 'DESC')
        .limit(500)
        .getRawMany<{ referrer: string; count: string }>(),
      base()
        .select('pv.asnOrg', 'asnOrg')
        .addSelect('MAX(pv.country)', 'country')
        .addSelect('COUNT(*)', 'count')
        .addSelect('COUNT(DISTINCT pv.ip)', 'uniqueIps')
        .groupBy('pv.asnOrg')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany<{ asnOrg: string | null; country: string | null; count: string; uniqueIps: string }>(),
    ]);

    return {
      days,
      totals: { pageViews: Number(totals?.pageViews ?? 0), uniqueIps: Number(totals?.uniqueIps ?? 0) },
      perDay: perDay.map((r) => ({ day: r.day, count: Number(r.count) })),
      topPages: topPages.map((r) => ({ host: r.host, path: r.path, count: Number(r.count) })),
      topReferrers: this.externalReferrerHosts(referrers),
      topNetworks: topNetworks.map((r) => ({
        asnOrg: r.asnOrg,
        country: r.country,
        count: Number(r.count),
        uniqueIps: Number(r.uniqueIps),
      })),
    };
  }

  // The Visitor's IP is personal data kept only for the retention window
  // the footer promises (ADR 0019).
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async purgeExpired(): Promise<void> {
    const result = await this.pageViews.delete({ createdAt: LessThan(this.since(PAGE_VIEW_RETENTION_DAYS)) });
    if (result.affected) this.logger.log(`Purged ${result.affected} Page Views older than ${PAGE_VIEW_RETENTION_DAYS} days.`);
  }

  // Referrers grouped by site host, minus the site's own hosts (in-site
  // navigation) — "where Visitors come from", not full URLs.
  private externalReferrerHosts(rows: { referrer: string; count: string }[]) {
    const byHost = new Map<string, number>();
    for (const row of rows) {
      const host = this.hostOf(row.referrer);
      if (!host || this.siteHosts.has(host)) continue;
      byHost.set(host, (byHost.get(host) ?? 0) + Number(row.count));
    }
    return [...byHost]
      .map(([host, count]) => ({ host, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private hostOf(url: string): string | null {
    try {
      return new URL(url).host || null;
    } catch {
      return null;
    }
  }

  private since(days: number): Date {
    return new Date(Date.now() - days * DAY_MS);
  }

  private escapeLike(value: string): string {
    return value.replace(/[\\%_]/g, (c) => `\\${c}`);
  }
}
