import { IsString } from 'class-validator';

export class EducationEntryDto {
  @IsString()
  school: string;

  @IsString()
  degree: string;

  @IsString()
  period: string;
}
