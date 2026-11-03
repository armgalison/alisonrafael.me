import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import type { MessageStreamEvent } from '@anthropic-ai/sdk/resources/messages.mjs';

export type ChatStreamEvent =
  | { type: 'token'; delta: string }
  | { type: 'done'; stopReason: string }
  | { type: 'error'; message: string };

type Emit = (event: ChatStreamEvent) => void;

@Injectable()
export class ChatStreamingService {
  private readonly logger = new Logger(ChatStreamingService.name);
  private readonly client: Anthropic;

  constructor(private config: ConfigService) {
    this.client = new Anthropic({
      apiKey: this.config.getOrThrow<string>('ANTHROPIC_API_KEY'),
    });
  }

  async streamChatResponse(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    systemPrompt: string,
    emit: Emit,
    signal?: AbortSignal,
  ): Promise<string> {
    let fullResponse = '';

    try {
      const stream = await this.client.messages.stream({
        model: 'claude-sonnet-5',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages as any,
      });

      for await (const event of stream) {
        if (signal?.aborted) break;

        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          const delta = event.delta.text;
          fullResponse += delta;
          emit({ type: 'token', delta });
        }
      }
      emit({ type: 'done', stopReason: 'end_turn' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Chat request failed';
      this.logger.error('streamChatResponse failed', err instanceof Error ? err.stack : String(err));
      emit({ type: 'error', message });
      throw err;
    }

    return fullResponse;
  }
}
