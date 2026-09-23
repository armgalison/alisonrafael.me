import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThanOrEqual, Repository } from 'typeorm';
import { BlogService } from '../blog/blog.service.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { Comment, CommentStatus } from './entities/comment.entity.js';

// How many times the async Jev check retries before giving up on a Comment
// (offensiveRate then stays null forever — moderation still works, it just
// won't show the Jev pill).
const MAX_OFFENSIVE_CHECK_ATTEMPTS = 10;

// How many due Comments a single sweep tick processes, so one slow/large
// batch can't starve newer pending checks for multiple ticks.
const OFFENSIVE_CHECK_BATCH_SIZE = 20;

// What a Visitor sees — no email, no status, one level of replies.
export interface PublicComment {
  id: string;
  authorName: string;
  body: string;
  createdAt: Date;
  replies: PublicComment[];
}

// What the Admin sees on the Comments page — includes the private email
// and the parent Post for context.
export interface AdminComment {
  id: string;
  authorName: string;
  authorEmail: string | null;
  body: string;
  status: CommentStatus;
  offensiveRate: number | null;
  parentId: string | null;
  postId: string;
  postTitle: string;
  postSlug: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    @InjectRepository(Comment) private readonly comments: Repository<Comment>,
    private readonly blog: BlogService,
    private readonly config: ConfigService,
  ) {}

  // Approved comments for a published Post, nested one level. `authorEmail`
  // is never loaded here (`select: false` on the column).
  async listApprovedTree(slug: string): Promise<PublicComment[]> {
    const postId = await this.blog.findPublishedIdBySlug(slug);
    const rows = await this.comments.find({
      where: { postId, status: 'approved' },
      order: { createdAt: 'ASC' },
    });

    const roots = new Map<string, PublicComment>();
    for (const row of rows) {
      if (row.parentId === null) {
        roots.set(row.id, {
          id: row.id,
          authorName: row.authorName,
          body: row.body,
          createdAt: row.createdAt,
          replies: [],
        });
      }
    }
    for (const row of rows) {
      if (row.parentId === null) continue;
      const parent = roots.get(row.parentId);
      // Drop a reply whose parent isn't itself an approved root.
      if (!parent) continue;
      parent.replies.push({
        id: row.id,
        authorName: row.authorName,
        body: row.body,
        createdAt: row.createdAt,
        replies: [],
      });
    }
    return [...roots.values()];
  }

  // Asks the Jev decision API (jev_decide, see https://www.jevai.org/docs) how
  // offensive a comment reads, via a `noul` question — a single 0-1 probability,
  // returned as-is (the caller decides what to do with it).
  async isCommentOffensive(comment: Pick<CreateCommentDto, 'authorName' | 'body'>): Promise<number> {
    const apiKey = this.config.getOrThrow<string>('JEV_API_KEY');

    const res = await fetch('https://www.jevai.org/api/v1/decisions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'typesafe-ai/jev',
        state: { authorName: comment.authorName, body: comment.body },
        questions: {
          offensive: {
            type: 'noul',
            instructions:
              'Is this blog comment offensive, hateful, harassing, or abusive toward a person or group? Return the probability that it is.',
          },
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Jev decision request failed: ${res.status} ${res.statusText}`);
    }

    const payload = (await res.json()) as {
      code: number;
      message: string;
      data?: { answers?: { offensive?: { noul?: number } } };
    };

    if (payload.code !== 0) {
      throw new Error(`Jev decision failed: ${payload.message}`);
    }

    return payload.data?.answers?.offensive?.noul ?? 0;
  }

  // Backoff between Jev retry attempts: 30s, 1m, 2m, 4m, ... capped at 30
  // minutes, so MAX_OFFENSIVE_CHECK_ATTEMPTS spreads out over several hours
  // instead of hammering a struggling API.
  private offensiveCheckBackoffMs(attempts: number): number {
    return Math.min(30_000 * 2 ** (attempts - 1), 30 * 60_000);
  }

  // Runs one Jev attempt for a queued Comment and updates its queue state:
  // 'done' with the rate on success, another 'pending' attempt with backoff
  // on failure, or 'failed' once MAX_OFFENSIVE_CHECK_ATTEMPTS is reached
  // (offensiveRate then stays null for good).
  private async attemptOffensiveCheck(comment: Comment): Promise<void> {
    try {
      const offensiveRate = await this.isCommentOffensive(comment);
      await this.comments.update(comment.id, { offensiveRate, offensiveCheckStatus: 'done' });
    } catch (err) {
      const attempts = comment.offensiveCheckAttempts + 1;
      if (attempts >= MAX_OFFENSIVE_CHECK_ATTEMPTS) {
        this.logger.warn(
          `Jev offensive check gave up on comment ${comment.id} after ${attempts} attempts, offensiveRate stays null: ${err}`,
        );
        await this.comments.update(comment.id, { offensiveCheckStatus: 'failed', offensiveCheckAttempts: attempts });
      } else {
        this.logger.warn(`Jev offensive check attempt ${attempts} failed for comment ${comment.id}, retrying: ${err}`);
        await this.comments.update(comment.id, {
          offensiveCheckAttempts: attempts,
          offensiveCheckNextRunAt: new Date(Date.now() + this.offensiveCheckBackoffMs(attempts)),
        });
      }
    }
  }

  // The Jev retry queue's sweep: picks up Comments due for a check and
  // attempts each in turn. "Due" covers new comments and backed-off retries
  // (offensiveCheckNextRunAt <= now) as well as comments that predate this
  // column and so never got a value for it (offensiveCheckNextRunAt IS
  // NULL) — those are treated as due immediately, which is how older
  // comments get swept into the queue. Best-effort by design — every
  // comment is already gated behind manual admin approval, so a
  // moderation-API outage only delays the Jev pill, never submission.
  @Interval(10000 )
  async processOffensiveCheckQueue(): Promise<void> {
    const due = await this.comments.find({
      where: [
        { offensiveCheckStatus: 'pending', offensiveCheckNextRunAt: LessThanOrEqual(new Date()) },
        { offensiveCheckStatus: 'pending', offensiveCheckNextRunAt: IsNull() },
      ],
      order: { offensiveCheckNextRunAt: 'ASC' },
      take: OFFENSIVE_CHECK_BATCH_SIZE,
    });
    for (const comment of due) {
      await this.attemptOffensiveCheck(comment);
    }
  }

  async create(slug: string, dto: CreateCommentDto): Promise<{ id: string; status: 'pending' }> {
    const postId = await this.blog.findPublishedIdBySlug(slug);

    if (dto.parentId) {
      const parent = await this.comments.findOne({ where: { id: dto.parentId } });
      if (!parent || parent.postId !== postId) {
        throw new NotFoundException('Parent comment not found');
      }
      if (parent.parentId !== null) {
        throw new BadRequestException('Replies can only be made to top-level comments');
      }
    }

    // The Jev check runs asynchronously off processOffensiveCheckQueue, not
    // here — comment submission never waits on it. offensiveCheckNextRunAt
    // is "now" so the next sweep tick picks it up immediately.
    const saved = await this.comments.save(
      this.comments.create({
        authorName: dto.authorName,
        authorEmail: dto.authorEmail ?? null,
        body: dto.body,
        postId,
        parentId: dto.parentId ?? null,
        status: 'pending',
        offensiveRate: null,
        offensiveCheckStatus: 'pending',
        offensiveCheckAttempts: 0,
        offensiveCheckNextRunAt: new Date(),
      }),
    );
    // Deliberately doesn't echo the body or email.
    return { id: saved.id, status: 'pending' };
  }

  async listForAdmin(status?: CommentStatus): Promise<AdminComment[]> {
    const qb = this.comments
      .createQueryBuilder('c')
      .addSelect('c.authorEmail')
      .innerJoin('c.post', 'p')
      .addSelect(['p.id', 'p.title', 'p.slug'])
      .orderBy('c.createdAt', 'DESC');
    if (status) qb.where('c.status = :status', { status });

    const rows = await qb.getMany();
    return rows.map((row) => this.toAdminShape(row));
  }

  async setStatus(id: string, status: CommentStatus): Promise<AdminComment> {
    const existing = await this.comments.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Comment not found');
    await this.comments.update(id, { status });

    const reloaded = await this.comments
      .createQueryBuilder('c')
      .addSelect('c.authorEmail')
      .innerJoin('c.post', 'p')
      .addSelect(['p.id', 'p.title', 'p.slug'])
      .where('c.id = :id', { id })
      .getOne();
    // Reload always succeeds — the row existed a statement ago and delete is
    // a separate admin action — but guard for the type.
    if (!reloaded) throw new NotFoundException('Comment not found');
    return this.toAdminShape(reloaded);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.comments.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Comment not found');
    // The self-referencing FK's `onDelete: 'CASCADE'` removes any replies.
    await this.comments.delete(id);
  }

  async pendingCount(): Promise<{ count: number }> {
    return { count: await this.comments.count({ where: { status: 'pending' } }) };
  }

  private toAdminShape(row: Comment): AdminComment {
    return {
      id: row.id,
      authorName: row.authorName,
      authorEmail: row.authorEmail,
      body: row.body,
      status: row.status,
      offensiveRate: row.offensiveRate,
      parentId: row.parentId,
      postId: row.post.id,
      postTitle: row.post.title,
      postSlug: row.post.slug,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
