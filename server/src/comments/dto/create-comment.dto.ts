import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  authorName: string;

  // Optional and private — stored for the Admin only, never returned on a
  // public endpoint (see ADR 0009).
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  authorEmail?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  body: string;

  // When present, the Comment is a reply to this top-level Comment. The
  // service rejects a parentId that is itself a reply or belongs to another
  // Post. The global ValidationPipe's `forbidNonWhitelisted` already blocks
  // a `status` field, so a reader cannot self-approve.
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
