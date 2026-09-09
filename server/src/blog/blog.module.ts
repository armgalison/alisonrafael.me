import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { BlogController } from './blog.controller.js';
import { BlogService } from './blog.service.js';
import { Post } from './entities/post.entity.js';

@Module({
  // AuthModule re-exports PassportModule, which JwtAuthGuard needs to
  // resolve its strategy config via Passport's own DI.
  imports: [TypeOrmModule.forFeature([Post]), AuthModule],
  controllers: [BlogController],
  providers: [BlogService],
  // TrendsModule reuses BlogService to save generated drafts, rather than
  // duplicating slug-collision/publishedAt logic.
  exports: [BlogService],
})
export class BlogModule {}
