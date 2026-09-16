import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';
import { EducationEntryDto } from './education-entry.dto.js';
import { ExperienceEntryDto } from './experience-entry.dto.js';
import { LanguageSkillDto } from './language-skill.dto.js';
import { ResumeLinksDto } from './resume-links.dto.js';
import { TechnologyGroupDto } from './technology-group.dto.js';

// Mirrors shared/src/resume.ts's ResumeProfile exactly — a full replace, not
// a partial patch, same as AtsResume.approve() replacing markdown whole.
export class UpdateResumeProfileDto {
  @IsString()
  name: string;

  @IsString()
  headline: string;

  @IsString()
  location: string;

  @ValidateNested()
  @Type(() => ResumeLinksDto)
  links: ResumeLinksDto;

  @IsArray()
  @IsString({ each: true })
  topSkills: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TechnologyGroupDto)
  technologyGroups: TechnologyGroupDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LanguageSkillDto)
  languages: LanguageSkillDto[];

  @IsArray()
  @IsString({ each: true })
  certifications: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceEntryDto)
  experience: ExperienceEntryDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationEntryDto)
  education: EducationEntryDto[];
}
