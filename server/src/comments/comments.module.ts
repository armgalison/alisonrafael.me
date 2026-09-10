import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { BlogModule } from '../blog/blog.module.js';
import { CommentsController } from './comments.controller.js';
import { CommentsService } from './comments.service.js';
import { Comment } from './entities/comment.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment]),
    // BlogService for published-Post lookups.
    BlogModule,
    // AuthModule re-exports PassportModule, which JwtAuthGuard needs on the
    // admin routes.
    AuthModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
