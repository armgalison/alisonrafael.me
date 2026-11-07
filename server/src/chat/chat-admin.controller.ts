import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ChatService } from './chat.service.js';

const PAGE_SIZE = 25;

// Read-only view of recorded visitor conversations for the Admin Panel's
// Chat Config → Conversations tab.
@Controller('chat/admin')
@UseGuards(JwtAuthGuard)
export class ChatAdminController {
  constructor(private readonly chat: ChatService) {}

  @Get('sessions')
  async listSessions(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number) {
    const current = Math.max(1, page);
    const { items, total } = await this.chat.listSessionsForAdmin(current, PAGE_SIZE);
    return { items, total, page: current, pageSize: PAGE_SIZE };
  }

  @Get('sessions/:id')
  getSession(@Param('id', ParseUUIDPipe) id: string) {
    return this.chat.getSessionWithMessages(id);
  }
}
