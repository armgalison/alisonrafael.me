import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Comment } from '../comments/entities/comment.entity.js';
import { BlogController } from './blog.controller.js';
import { BlogService } from './blog.service.js';
import { Post } from './entities/post.entity.js';

@Module({
  // AuthModule re-exports PassportModule, which JwtAuthGuard needs to
  // resolve its strategy config via Passport's own DI. Comment is registered
  // here too so BlogService can run the approved-comment-count query for the
  // public list; CommentsModule owns the Comment write paths.
  imports: [TypeOrmModule.forFeature([Post, Comment]), AuthModule],
  controllers: [BlogController],
  providers: [BlogService],
  // TrendsModule reuses BlogService to save generated drafts, rather than
  // duplicating slug-collision/publishedAt logic.
  exports: [BlogService],
})
export class BlogModule {}
