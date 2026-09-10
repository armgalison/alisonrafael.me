import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { Request } from 'express';

// Max comment submissions allowed per client IP per window.
const MAX_PER_WINDOW = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

// A deliberately tiny in-process fixed-window limiter for the single public
// comment-create route (see ADR 0009 for why not @nestjs/throttler). The
// counter is per-process and resets on restart — fine for one low-traffic
// container. `trust proxy` in main.ts makes `req.ip` the real client IP.
@Injectable()
export class CommentRateLimitGuard implements CanActivate {
  private readonly hits = new Map<string, { count: number; windowStart: number }>();

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const key = req.ip ?? 'unknown';
    const now = Date.now();

    this.prune(now);

    const entry = this.hits.get(key);
    if (!entry || now - entry.windowStart >= WINDOW_MS) {
      this.hits.set(key, { count: 1, windowStart: now });
      return true;
    }

    if (entry.count >= MAX_PER_WINDOW) {
      throw new HttpException('Too many comments — try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }

    entry.count += 1;
    return true;
  }

  // Drop expired windows so the map can't grow unbounded with unique IPs.
  private prune(now: number): void {
    for (const [key, entry] of this.hits) {
      if (now - entry.windowStart >= WINDOW_MS) this.hits.delete(key);
    }
  }
}
