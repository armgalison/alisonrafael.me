import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ResumeProfileModule } from '../resume-profile/resume-profile.module.js';
import { ToolsController } from './tools.controller.js';
import { ToolsService } from './tools.service.js';

@Module({
  imports: [AuthModule, ResumeProfileModule],
  controllers: [ToolsController],
  providers: [ToolsService],
})
export class ToolsModule {}
