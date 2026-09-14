import { Body, Controller, Get, Logger, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateDraftsDto } from './dto/create-drafts.dto.js';
import { TrendsService } from './trends.service.js';

@Controller('trends')
@UseGuards(JwtAuthGuard)
export class TrendsController {
  private readonly logger = new Logger(TrendsController.name);

  constructor(private readonly trends: TrendsService) {}

  // The most recently saved search, if any — never triggers a new (paid)
  // Claude call. The Admin decides when that happens via POST /discover.
  @Get('searches/latest')
  getLatestSearch() {
    return this.trends.getLatestSearch();
  }

  // Streamed as Server-Sent Events (see ADR 0007's streaming addendum) —
  // raw @Res() rather than Nest's @Sse() decorator, since there's no
  // established @Post() + @Body() DTO pattern for @Sse() to build on here,
  // and this needs X-Accel-Buffering set for the nginx-proxy in front (see
  // main.ts's `trust proxy` note) plus the ability to emit a final `error`
  // frame instead of throwing once headers are already flushed.
  @Post('discover')
  async discover(@Res() res: Response) {
    this.startStream(res);
    const controller = new AbortController();
    res.on('close', () => controller.abort());

    try {
      await this.trends.discoverStream((event) => res.write(`data: ${JSON.stringify(event)}\n\n`), controller.signal);
    } catch (err) {
      this.logger.error('discover() failed', err instanceof Error ? err.stack : String(err));
      this.writeError(res, err, 'Trend discovery failed');
    } finally {
      res.end();
    }
  }

  @Post('drafts')
  async createDrafts(@Body() dto: CreateDraftsDto, @Res() res: Response) {
    this.startStream(res);
    const controller = new AbortController();
    res.on('close', () => controller.abort());

    try {
      await this.trends.createDraftsStream(
        dto.trends,
        (event) => res.write(`data: ${JSON.stringify(event)}\n\n`),
        controller.signal,
      );
    } catch (err) {
      this.logger.error('createDrafts() failed', err instanceof Error ? err.stack : String(err));
      this.writeError(res, err, 'Draft creation failed');
    } finally {
      res.end();
    }
  }

  private startStream(res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
  }

  // Surfaces the real reason (e.g. a truncated/malformed Claude response)
  // to the Admin instead of a generic failure — this is a single-admin
  // tool, not a public API, so there's no one else to leak internals to.
  // Can't throw a Nest exception here: headers are already flushed once
  // streaming has started, so the error has to be one more SSE frame.
  private writeError(res: Response, err: unknown, fallback: string) {
    if (res.writableEnded) return;
    const message = err instanceof Error ? err.message : fallback;
    res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`);
  }
}
