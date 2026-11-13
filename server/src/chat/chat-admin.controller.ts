import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ChatService } from './chat.service.js';
import { ListChatConversationsQueryDto } from './dto/list-chat-conversations-query.dto.js';

const PAGE_SIZE = 25;

// Read-only view of recorded visitor conversations for the Admin Panel's
// Chat Config → Conversations tab.
@Controller('chat/admin')
@UseGuards(JwtAuthGuard)
export class ChatAdminController {
  constructor(private readonly chat: ChatService) {}

  @Get('sessions')
  async listSessions(@Query() query: ListChatConversationsQueryDto) {
    const current = query.page ?? 1;
    const { items, total } = await this.chat.listSessionsForAdmin(current, PAGE_SIZE, {
      days: query.days,
      network: query.network,
    });
    return { items, total, page: current, pageSize: PAGE_SIZE };
  }

  @Get('sessions/:id')
  getSession(@Param('id', ParseUUIDPipe) id: string) {
    return this.chat.getSessionWithMessages(id);
  }
}
