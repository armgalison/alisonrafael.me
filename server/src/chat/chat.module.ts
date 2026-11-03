import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';
import { ChatStreamingService } from './chat-streaming.service.js';
import { ChatConfigService } from './chat-config.service.js';
import { ChatConfigController } from './chat-config.controller.js';
import { ChatSession } from './entities/chat-session.entity.js';
import { ChatMessage } from './entities/chat-message.entity.js';
import { ChatConfig } from './entities/chat-config.entity.js';
import { ChatConfigVersion } from './entities/chat-config-version.entity.js';
import { ResumeProfileModule } from '../resume-profile/resume-profile.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatSession, ChatMessage, ChatConfig, ChatConfigVersion]),
    ResumeProfileModule,
  ],
  controllers: [ChatController, ChatConfigController],
  providers: [ChatService, ChatStreamingService, ChatConfigService],
  exports: [ChatService, ChatConfigService],
})
export class ChatModule {}
