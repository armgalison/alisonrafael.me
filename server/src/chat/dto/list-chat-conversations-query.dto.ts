import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ListChatConversationsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  // Only Chat Conversations with a message in the last N days.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3650)
  days?: number;

  // Case-insensitive "contains" match on the Visitor's network (asnOrg).
  @IsOptional()
  @IsString()
  @MaxLength(255)
  network?: string;
}
