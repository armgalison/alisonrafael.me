import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ApproveAtsResumeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20000)
  markdown: string;
}
