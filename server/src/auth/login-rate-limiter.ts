import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

// Failed Admin logins allowed per client IP per window, shared by
// POST /auth/login and the Admin MCP's OAuth login page (ADR 0021): the
// same password unlocks both, so limiting only one would be cosmetic.
export const LOGIN_MAX_FAILURES_PER_WINDOW = 5;
export const LOGIN_FAILURE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Same in-process fixed-window shape as the other limiters (ADR 0009):
// per-process and reset on restart. Unlike them it counts only failures —
// a guard can't see the outcome, so callers check, then record.
@Injectable()
export class LoginRateLimiter {
  private readonly failures = new Map<string, { count: number; windowStart: number }>();

  // Throws 429 once the IP has used up its failures for the window.
  assertAllowed(ip: string | undefined): void {
    const now = Date.now();
    this.prune(now);
    const entry = this.failures.get(ip ?? 'unknown');
    if (entry && entry.count >= LOGIN_MAX_FAILURES_PER_WINDOW) {
      throw new HttpException('Too many failed logins. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  recordFailure(ip: string | undefined): void {
    const key = ip ?? 'unknown';
    const now = Date.now();
    const entry = this.failures.get(key);
    if (!entry || now - entry.windowStart >= LOGIN_FAILURE_WINDOW_MS) {
      this.failures.set(key, { count: 1, windowStart: now });
    } else {
      entry.count += 1;
    }
  }

  recordSuccess(ip: string | undefined): void {
    this.failures.delete(ip ?? 'unknown');
  }

  private prune(now: number): void {
    for (const [key, entry] of this.failures) {
      if (now - entry.windowStart >= LOGIN_FAILURE_WINDOW_MS) this.failures.delete(key);
    }
  }
}
