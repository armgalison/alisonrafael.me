import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ChatConfigService } from './chat-config.service.js';
import { UpdateChatConfigDto } from './dto/update-chat-config.dto.js';
import { PreviewChatConfigDto } from './dto/preview-chat-config.dto.js';

@Controller('chat/config')
export class ChatConfigController {
  constructor(private readonly config: ChatConfigService) {}

  @Get('template')
  @UseGuards(JwtAuthGuard)
  async getTemplate() {
    const config = await this.config.getTemplate();
    return {
      id: config.id,
      systemPromptTemplate: config.systemPromptTemplate,
      description: config.description,
      updatedAt: config.updatedAt,
    };
  }

  @Post('preview')
  @UseGuards(JwtAuthGuard)
  async preview(@Body() dto: PreviewChatConfigDto) {
    const rendered = await this.config.renderPreview(dto.systemPromptTemplate);
    return { preview: rendered };
  }

  @Put('template')
  @UseGuards(JwtAuthGuard)
  async updateTemplate(@Body() dto: UpdateChatConfigDto) {
    await this.config.updateTemplate(dto.systemPromptTemplate, dto.reason);
    return { success: true, message: 'System prompt updated' };
  }

  @Post('reset')
  @UseGuards(JwtAuthGuard)
  async resetToDefault(@Body() body: { reason?: string }) {
    await this.config.resetToDefault(body.reason);
    return { success: true, message: 'System prompt reset to default' };
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getHistory() {
    const versions = await this.config.getHistory(20);
    return {
      versions: versions.map((v) => ({
        id: v.id,
        createdAt: v.createdAt,
        changeReason: v.changeReason,
      })),
    };
  }

  @Get('history/:id')
  @UseGuards(JwtAuthGuard)
  async getVersion(@Param('id') id: string) {
    // This would need to be implemented with a proper find method
    return { id, systemPromptTemplate: 'version content' };
  }
}
