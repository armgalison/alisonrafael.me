import { IsString, MinLength } from 'class-validator';

export class UpdateChatConfigDto {
  @IsString()
  @MinLength(50)
  systemPromptTemplate: string;

  @IsString()
  reason?: string;
}
