import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { BlogModule } from '../blog/blog.module.js';
import { TrendsController } from './trends.controller.js';
import { TrendsService } from './trends.service.js';

@Module({
  imports: [AuthModule, BlogModule],
  controllers: [TrendsController],
  providers: [TrendsService],
})
export class TrendsModule {}
