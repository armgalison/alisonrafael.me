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
      // Detect specific error types
      let message = 'Chat request failed';

      if (err instanceof Error) {
        const errorStr = err.message.toLowerCase();

        // Check for quota/credit errors
        if (errorStr.includes('quota') || errorStr.includes('rate limit') || errorStr.includes('429')) {
          message = 'API quota exceeded. Please contact the administrator.';
          this.logger.warn('API quota exceeded');
        }
        // Check for authentication errors
        else if (errorStr.includes('unauthorized') || errorStr.includes('401') || errorStr.includes('invalid api key')) {
          message = 'API key is invalid. Please check your configuration.';
          this.logger.warn('API authentication failed');
        }
        // Check for server errors
        else if (errorStr.includes('500') || errorStr.includes('server error')) {
          message = 'The AI service is temporarily unavailable. Please try again later.';
          this.logger.error('Anthropic API server error');
        }
        // Default: use the actual error message
        else {
          message = err.message;
        }
      }

      this.logger.error('streamChatResponse failed', err instanceof Error ? err.stack : String(err));
      emit({ type: 'error', message });
      throw err;
    }

    return fullResponse;
  }
}
