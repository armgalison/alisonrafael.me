import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GenerateAtsResumeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20000)
  jobDescription: string;
}
