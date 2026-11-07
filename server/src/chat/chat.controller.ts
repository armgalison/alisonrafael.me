import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Ip, Logger, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ChatService } from './chat.service.js';
import { ChatRateLimitGuard } from './chat-rate-limit.guard.js';
import { ChatMessageDto } from './dto/chat-message.dto.js';

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chat: ChatService) {}

  @Post('sessions')
  async createSession(@Ip() ip: string, @Headers('user-agent') userAgent: string | undefined) {
    const session = await this.chat.createSession(ip, userAgent);
    return { sessionId: session.id };
  }

  @Get('sessions/:id/history')
  async getHistory(@Res() res: Response) {
    // Optionally rate-limit history retrieval too
    const sessionId = res.req.params.id as string;
    const messages = await this.chat.getSessionMessages(sessionId);
    res.json(messages);
  }

  @UseGuards(ChatRateLimitGuard)
  @Post('message')
  @HttpCode(HttpStatus.OK)
  async streamMessage(@Body() dto: ChatMessageDto, @Res() res: Response) {
    this.startStream(res);
    const controller = new AbortController();
    res.on('close', () => controller.abort());

    try {
      await this.chat.streamResponse(
        dto.sessionId,
        dto.content,
        (event) => res.write(`data: ${JSON.stringify(event)}\n\n`),
        controller.signal,
      );
    } catch (err) {
      this.logger.error('streamMessage() failed', err instanceof Error ? err.stack : String(err));
      this.writeError(res, err, 'Chat request failed');
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

  private writeError(res: Response, err: unknown, fallback: string) {
    if (res.writableEnded) return;
    const message = err instanceof Error ? err.message : fallback;
    res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`);
  }
}
