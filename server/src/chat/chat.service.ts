import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from './entities/chat-session.entity.js';
import { ChatMessage, ChatRole } from './entities/chat-message.entity.js';
import { ChatStreamingService, ChatStreamEvent } from './chat-streaming.service.js';
import { ResumeProfileService } from '../resume-profile/resume-profile.service.js';

type Emit = (event: ChatStreamEvent) => void;

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatSession)
    private sessions: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private messages: Repository<ChatMessage>,
    private streaming: ChatStreamingService,
    private profile: ResumeProfileService,
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

    // Build system prompt with resume context
    const profile = await this.profile.get();
    const systemPrompt = this.buildSystemPrompt(profile);

    // Prepare Claude messages
    const claudeMessages = conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
    claudeMessages.push({ role: 'user' as const, content: userMessage });

    try {
      // Stream response from Claude
      const assistantResponse = await this.streaming.streamChatResponse(
        claudeMessages,
        systemPrompt,
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

  private buildSystemPrompt(profile: any): string {
    const skillsText = profile?.skills?.map((s: any) => s.name).join(', ') || '';
    const headline = profile?.headline || 'Full-stack software engineer';

    return `You are Alison Rafael, a ${headline}. You're on your professional website talking with visitors.

Profile Summary:
- Name: ${profile?.fullName || 'Alison Rafael'}
- Headline: ${headline}
- Skills: ${skillsText}

Be conversational, friendly, and professional. Keep responses concise (2-3 sentences).
If asked about specific experiences or projects, reference your background authentically.
If asked something outside your knowledge, suggest connecting via email.`;
  }
}
