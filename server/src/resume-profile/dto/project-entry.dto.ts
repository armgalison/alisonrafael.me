import { IsArray, IsString } from 'class-validator';

export class ProjectEntryDto {
  @IsString()
  name: string;

  @IsString()
  period: string;

  @IsString()
  association: string;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  skills: string[];
}
