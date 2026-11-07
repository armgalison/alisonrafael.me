import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Not, IsNull, Repository } from 'typeorm';
import { IpLookupService } from '../page-views/ip-lookup.service.js';
import { PAGE_VIEW_RETENTION_DAYS } from '../page-views/page-views.constants.js';
import { ChatSession } from './entities/chat-session.entity.js';
import { ChatMessage, ChatRole } from './entities/chat-message.entity.js';
import { ChatStreamingService, ChatStreamEvent } from './chat-streaming.service.js';
import { ChatConfigService } from './chat-config.service.js';

type Emit = (event: ChatStreamEvent) => void;

export interface ChatSessionSummary {
  id: string;
  firstMessageAt: Date;
  lastMessageAt: Date;
  messageCount: number;
  preview: string;
  ip: string | null;
  country: string | null;
  asnOrg: string | null;
}

const PREVIEW_LENGTH = 120;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(ChatSession)
    private sessions: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private messages: Repository<ChatMessage>,
    private streaming: ChatStreamingService,
    private configService: ChatConfigService,
    private ipLookup: IpLookupService,
  ) {}

  // A new session, tagged with the Visitor's IP and its offline
  // country/network lookup — the same details the Access Log keeps.
  async createSession(ip: string, userAgent: string | undefined): Promise<ChatSession> {
    // Express reports IPv4 clients on a dual-stack socket as ::ffff:a.b.c.d.
    const normalizedIp = ip.replace(/^::ffff:(?=\d+\.\d+\.\d+\.\d+$)/, '');
    const session = this.sessions.create({
      ip: normalizedIp,
      userAgent: userAgent ? userAgent.slice(0, 512) : null,
      ...this.ipLookup.lookup(normalizedIp),
    });
    return this.sessions.save(session);
  }

  // Same retention as Page Views (ADR 0019): drop the IP and user agent,
  // keep the conversation and its coarse country/network.
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async purgeExpiredVisitorDetails(): Promise<void> {
    const cutoff = new Date(Date.now() - PAGE_VIEW_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const result = await this.sessions.update(
      { createdAt: LessThan(cutoff), ip: Not(IsNull()) },
      { ip: null, userAgent: null },
    );
    if (result.affected) this.logger.log(`Cleared Visitor IPs on ${result.affected} chat sessions.`);
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

  // Admin Panel: sessions that hold at least one message (the hero opens a
  // session on every page load, most never used), newest activity first.
  async listSessionsForAdmin(
    page: number,
    pageSize: number,
  ): Promise<{ items: ChatSessionSummary[]; total: number }> {
    const base = this.sessions
      .createQueryBuilder('s')
      .innerJoin(ChatMessage, 'm', 'm.sessionId = s.id');

    const total = await base.clone().select('COUNT(DISTINCT s.id)', 'n').getRawOne<{ n: string }>();

    const rows = await base
      .clone()
      .select('s.id', 'id')
      .addSelect('s.ip', 'ip')
      .addSelect('s.country', 'country')
      .addSelect('s.asnOrg', 'asnOrg')
      .addSelect('MIN(m.createdAt)', 'firstMessageAt')
      .addSelect('MAX(m.createdAt)', 'lastMessageAt')
      .addSelect('COUNT(m.id)', 'messageCount')
      .groupBy('s.id')
      .addGroupBy('s.ip')
      .addGroupBy('s.country')
      .addGroupBy('s.asnOrg')
      .orderBy('lastMessageAt', 'DESC')
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .getRawMany<{
        id: string;
        ip: string | null;
        country: string | null;
        asnOrg: string | null;
        firstMessageAt: Date;
        lastMessageAt: Date;
        messageCount: string;
      }>();

    const previews = new Map<string, string>();
    if (rows.length > 0) {
      const firstUserMessages = await this.messages
        .createQueryBuilder('m')
        .where('m.sessionId IN (:...ids)', { ids: rows.map((r) => r.id) })
        .andWhere("m.role = 'user'")
        .orderBy('m.createdAt', 'ASC')
        .getMany();
      for (const msg of firstUserMessages) {
        if (!previews.has(msg.sessionId)) previews.set(msg.sessionId, msg.content.slice(0, PREVIEW_LENGTH));
      }
    }

    return {
      total: Number(total?.n ?? 0),
      items: rows.map((r) => ({
        id: r.id,
        firstMessageAt: new Date(r.firstMessageAt),
        lastMessageAt: new Date(r.lastMessageAt),
        messageCount: Number(r.messageCount),
        preview: previews.get(r.id) ?? '',
        ip: r.ip,
        country: r.country,
        asnOrg: r.asnOrg,
      })),
    };
  }

  async getSessionWithMessages(id: string) {
    const session = await this.sessions.findOne({ where: { id } });
    if (!session) throw new NotFoundException('Conversation not found');
    const messages = await this.getSessionMessages(id);
    return {
      id: session.id,
      firstMessageAt: messages[0]?.createdAt ?? session.firstMessageAt,
      lastMessageAt: messages.at(-1)?.createdAt ?? session.lastMessageAt,
      ip: session.ip,
      userAgent: session.userAgent,
      country: session.country,
      asn: session.asn,
      asnOrg: session.asnOrg,
      messages: messages.map((m) => ({ id: m.id, role: m.role, content: m.content, createdAt: m.createdAt })),
    };
  }
}
