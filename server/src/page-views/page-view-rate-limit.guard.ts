import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { PAGE_VIEW_MAX_PER_WINDOW, PAGE_VIEW_WINDOW_MS } from './page-views.constants.js';

// Same in-process fixed-window shape as CommentRateLimitGuard (ADR 0009),
// with its own limits: per-process, reset on restart, keyed by `req.ip`
// (real client IP thanks to `trust proxy` in main.ts).
@Injectable()
export class PageViewRateLimitGuard implements CanActivate {
  private readonly hits = new Map<string, { count: number; windowStart: number }>();

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const key = req.ip ?? 'unknown';
    const now = Date.now();

    this.prune(now);

    const entry = this.hits.get(key);
    if (!entry || now - entry.windowStart >= PAGE_VIEW_WINDOW_MS) {
      this.hits.set(key, { count: 1, windowStart: now });
      return true;
    }

    if (entry.count >= PAGE_VIEW_MAX_PER_WINDOW) {
      throw new HttpException('Too many page views.', HttpStatus.TOO_MANY_REQUESTS);
    }

    entry.count += 1;
    return true;
  }

  private prune(now: number): void {
    for (const [key, entry] of this.hits) {
      if (now - entry.windowStart >= PAGE_VIEW_WINDOW_MS) this.hits.delete(key);
    }
  }
}
