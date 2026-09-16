import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ExperienceRoleDto } from './experience-role.dto.js';

export class ExperienceEntryDto {
  @IsString()
  company: string;

  @IsOptional()
  @IsString()
  totalDuration?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceRoleDto)
  roles: ExperienceRoleDto[];

  @IsBoolean()
  emphasized: boolean;
}
