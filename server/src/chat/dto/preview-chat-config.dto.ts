import { IsString, MinLength } from 'class-validator';

export class PreviewChatConfigDto {
  @IsString()
  @MinLength(50)
  systemPromptTemplate: string;
}
