import { IsArray, IsString } from 'class-validator';

export class TechnologyGroupDto {
  @IsString()
  label: string;

  @IsArray()
  @IsString({ each: true })
  items: string[];
}
