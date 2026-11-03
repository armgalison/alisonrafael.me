import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';
import { ChatStreamingService } from './chat-streaming.service.js';
import { ChatSession } from './entities/chat-session.entity.js';
import { ChatMessage } from './entities/chat-message.entity.js';
import { ResumeProfileModule } from '../resume-profile/resume-profile.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([ChatSession, ChatMessage]), ResumeProfileModule],
  controllers: [ChatController],
  providers: [ChatService, ChatStreamingService],
  exports: [ChatService],
})
export class ChatModule {}
