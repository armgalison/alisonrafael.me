import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post as HttpPost,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CommentRateLimitGuard } from './comment-rate-limit.guard.js';
import { CommentsService } from './comments.service.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { ListCommentsQueryDto } from './dto/list-comments-query.dto.js';
import { UpdateCommentStatusDto } from './dto/update-comment-status.dto.js';

// Also mounted under `posts` so the public URLs read /posts/:slug/comments.
// Every route here is >= 2 segments after `posts`, so none collide with
// BlogController's GET /posts/:slug; admin/literal routes are declared first
// anyway, matching that controller's ordering convention.
@Controller('posts')
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  // --- Admin routes ---

  @UseGuards(JwtAuthGuard)
  @Get('comments/admin/pending-count')
  pendingCount() {
    return this.comments.pendingCount();
  }

  @UseGuards(JwtAuthGuard)
  @Get('comments/admin')
  listForAdmin(@Query() query: ListCommentsQueryDto) {
    return this.comments.listForAdmin(query.status);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('comments/admin/:id/status')
  setStatus(@Param('id') id: string, @Body() dto: UpdateCommentStatusDto) {
    return this.comments.setStatus(id, dto.status);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('comments/admin/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.comments.remove(id);
  }

  // --- Public routes ---

  @Get(':slug/comments')
  list(@Param('slug') slug: string) {
    return this.comments.listApprovedTree(slug);
  }

  @UseGuards(CommentRateLimitGuard)
  @HttpPost(':slug/comments')
  @HttpCode(HttpStatus.CREATED)
  create(@Param('slug') slug: string, @Body() dto: CreateCommentDto) {
    return this.comments.create(slug, dto);
  }
}
