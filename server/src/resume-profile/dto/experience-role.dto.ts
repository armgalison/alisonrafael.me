import { IsBoolean, IsString } from 'class-validator';

export class ExperienceRoleDto {
  @IsString()
  title: string;

  @IsString()
  period: string;

  @IsString()
  location: string;

  @IsString()
  description: string;

  @IsBoolean()
  emphasized: boolean;
}
