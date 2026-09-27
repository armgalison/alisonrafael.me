import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreatePageViewDto {
  // The path as the browser shows it. The service additionally checks it
  // against the public routes of the host it came from.
  @IsString()
  @MaxLength(512)
  @Matches(/^\/[a-z0-9/-]*$/, { message: 'path must be a public page path' })
  path: string;

  // document.referrer on a full load, the previous in-site URL on a
  // client-side navigation. Over-long values are truncated, not rejected.
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  referrer?: string;
}
