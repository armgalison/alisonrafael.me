import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { PAGE_VIEW_RETENTION_DAYS } from '../page-views.constants.js';

export class ListPageViewsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PAGE_VIEW_RETENTION_DAYS)
  days?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  host?: string;

  // Prefix match, so "/" + a host lists everything on it.
  @IsOptional()
  @IsString()
  @MaxLength(512)
  path?: string;

  @IsOptional()
  @IsString()
  @MaxLength(45)
  ip?: string;

  // Case-insensitive "contains" match on the IP's network/organization
  // (asnOrg) — "did Company X look at the resume?" (ADR 0019).
  @IsOptional()
  @IsString()
  @MaxLength(255)
  network?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize?: number;
}

export class PageViewSummaryQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsIn([7, 30])
  days?: 7 | 30;
}
