import { Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { McpOAuthService } from './mcp-oauth.service.js';

// Settings → Connected clients in the Admin Panel (ADR 0021). Guarded by
// the Admin Panel's JWT; an Admin MCP token can't reach it.
@Controller('mcp/admin/clients')
@UseGuards(JwtAuthGuard)
export class McpAdminController {
  constructor(private readonly oauth: McpOAuthService) {}

  @Get()
  list() {
    return this.oauth.listConnectedClients();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revoke(@Param('id', ParseUUIDPipe) id: string) {
    if (!(await this.oauth.revokeConnectedClient(id))) throw new NotFoundException('Connected client not found');
  }
}
