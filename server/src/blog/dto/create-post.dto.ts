import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase, alphanumeric, and hyphen-separated',
  })
  slug: string;

  @IsString()
  @IsNotEmpty()
  excerpt: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  // Optional cover image URL (from POST /uploads). `@IsOptional()` accepts
  // both `undefined` (leave as-is on update) and `null` (clear it).
  @IsOptional()
  @IsString()
  @MaxLength(512)
  coverImageUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
