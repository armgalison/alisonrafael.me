import { IsString } from 'class-validator';

export class ResumeLinksDto {
  @IsString()
  phone: string;

  @IsString()
  email: string;

  @IsString()
  linkedin: string;

  @IsString()
  linkedinLabel: string;

  @IsString()
  github: string;

  @IsString()
  githubLabel: string;

  @IsString()
  website: string;

  @IsString()
  websiteLabel: string;
}
