import { IsIn } from 'class-validator';
import type { CommentStatus } from '../entities/comment.entity.js';

export class UpdateCommentStatusDto {
  @IsIn(['pending', 'approved', 'rejected'])
  status: CommentStatus;
}
