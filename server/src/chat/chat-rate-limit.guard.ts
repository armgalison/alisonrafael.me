import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { Request } from 'express';

const MAX_PER_DAY = 10;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

@Injectable()
export class ChatRateLimitGuard implements CanActivate {
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

    if (entry.count >= MAX_PER_DAY) {
      throw new HttpException(
        'Daily chat limit reached. Try again tomorrow.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    entry.count += 1;
    return true;
  }

  private prune(now: number): void {
    for (const [key, entry] of this.hits) {
      if (now - entry.windowStart >= WINDOW_MS) this.hits.delete(key);
    }
  }
}
