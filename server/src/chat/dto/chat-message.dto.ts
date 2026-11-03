import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class ChatMessageDto {
  @IsUUID()
  sessionId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;
}
