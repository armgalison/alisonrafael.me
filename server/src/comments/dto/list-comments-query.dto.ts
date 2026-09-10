import { IsIn, IsOptional } from 'class-validator';
import type { CommentStatus } from '../entities/comment.entity.js';

export class ListCommentsQueryDto {
  @IsOptional()
  @IsIn(['pending', 'approved', 'rejected'])
  status?: CommentStatus;
}
