import { IsString } from 'class-validator';

export class LanguageSkillDto {
  @IsString()
  name: string;

  @IsString()
  level: string;
}
