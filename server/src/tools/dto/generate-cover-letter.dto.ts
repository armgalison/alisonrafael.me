import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GenerateCoverLetterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20000)
  jobDescription: string;
}
