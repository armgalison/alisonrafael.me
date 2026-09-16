import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { UpdateResumeProfileDto } from './dto/update-resume-profile.dto.js';
import { ResumeProfileService } from './resume-profile.service.js';

@Controller('resume-profile')
export class ResumeProfileController {
  constructor(private readonly resumeProfile: ResumeProfileService) {}

  // Public — the public resume page (web-client's src/i18n's getResumeContent)
  // fetches this at request time, cached until the Admin's next save.
  @Get()
  get() {
    return this.resumeProfile.get();
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  update(@Body() dto: UpdateResumeProfileDto) {
    return this.resumeProfile.update(dto);
  }
}
