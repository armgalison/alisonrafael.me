import { BadGatewayException, Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AtsResumeService } from './ats-resume.service.js';
import { ApproveAtsResumeDto } from './dto/approve-ats-resume.dto.js';
import { GenerateAtsResumeDto } from './dto/generate-ats-resume.dto.js';

@Controller('ats-resume')
@UseGuards(JwtAuthGuard)
export class AtsResumeController {
  constructor(private readonly atsResume: AtsResumeService) {}

  // Never triggers a new (paid) Claude call — same pattern as Trends'
  // GET /trends/searches/latest, so reopening the tool shows the last
  // draft for free.
  @Get('latest')
  getLatest() {
    return this.atsResume.getLatest();
  }

  @Post('generate')
  async generate(@Body() dto: GenerateAtsResumeDto) {
    try {
      return await this.atsResume.generate(dto.jobDescription);
    } catch (err) {
      throw new BadGatewayException(err instanceof Error ? err.message : 'Resume generation failed');
    }
  }

  // No Claude call here (just PDF rendering + a disk write), so unlike
  // generate() there's no external-API failure worth masking behind
  // BadGatewayException — a missing draft surfaces as Nest's normal 404.
  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() dto: ApproveAtsResumeDto) {
    return this.atsResume.approve(id, dto.markdown);
  }
}
