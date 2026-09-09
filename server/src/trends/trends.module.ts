import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { BlogModule } from '../blog/blog.module.js';
import { TrendSearch } from './entities/trend-search.entity.js';
import { TrendsController } from './trends.controller.js';
import { TrendsService } from './trends.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([TrendSearch]), AuthModule, BlogModule],
  controllers: [TrendsController],
  providers: [TrendsService],
})
export class TrendsModule {}
