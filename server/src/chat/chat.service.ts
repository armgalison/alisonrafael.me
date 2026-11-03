import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from './entities/chat-session.entity.js';
import { ChatMessage, ChatRole } from './entities/chat-message.entity.js';
import { ChatStreamingService, ChatStreamEvent } from './chat-streaming.service.js';
import { ChatConfigService } from './chat-config.service.js';

type Emit = (event: ChatStreamEvent) => void;

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatSession)
    private sessions: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private messages: Repository<ChatMessage>,
    private streaming: ChatStreamingService,
    private configService: ChatConfigService,
  ) {}

  async getOrCreateSession(id?: string): Promise<ChatSession> {
    if (id) {
      const existing = await this.sessions.findOne({ where: { id } });
      if (existing) return existing;
    }

    const session = this.sessions.create();
    return this.sessions.save(session);
  }

  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    return this.messages.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
    });
  }

  async streamResponse(
    sessionId: string,
    userMessage: string,
    emit: Emit,
    signal?: AbortSignal,
  ): Promise<void> {
    const session = await this.sessions.findOneOrFail({ where: { id: sessionId } });
    const conversationHistory = await this.getSessionMessages(sessionId);

    // Save user message
    const userMsg = this.messages.create({
      sessionId,
      role: 'user' as ChatRole,
      content: userMessage,
    });
    await this.messages.save(userMsg);

    // Prepare Claude messages
    const claudeMessages = conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
    claudeMessages.push({ role: 'user' as const, content: userMessage });

    try {
      // Get rendered system prompt with current config
      const renderedPrompt = await this.configService.getRendered();

      // Stream response from Claude
      const assistantResponse = await this.streaming.streamChatResponse(
        claudeMessages,
        renderedPrompt,
        emit,
        signal,
      );

      // Save assistant response
      const assistantMsg = this.messages.create({
        sessionId,
        role: 'assistant' as ChatRole,
        content: assistantResponse,
      });
      await this.messages.save(assistantMsg);

      // Update session timestamp
      session.lastMessageAt = new Date();
      await this.sessions.save(session);
    } catch (err) {
      // Error already emitted by streaming service
      throw err;
    }
  }
}
