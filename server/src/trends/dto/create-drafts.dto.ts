import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

class SelectedTrendDto {
  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsString()
  @IsNotEmpty()
  summary: string;

  // The frontend round-trips the full RankedTrend it already has in state
  // (topic + summary + relevance) rather than stripping fields down to
  // just what /trends/drafts needs — accepted here so the global
  // ValidationPipe's forbidNonWhitelisted doesn't reject it. Unused by
  // TrendsService, which only reads topic/summary.
  @IsOptional()
  @IsString()
  relevance?: string;
}

export class CreateDraftsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => SelectedTrendDto)
  trends: SelectedTrendDto[];
}
