import { BadGatewayException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { GenerateCoverLetterDto } from './dto/generate-cover-letter.dto.js';
import { ToolsService } from './tools.service.js';

@Controller('tools')
@UseGuards(JwtAuthGuard)
export class ToolsController {
  constructor(private readonly tools: ToolsService) {}

  // Plain synchronous JSON, unlike trends' SSE endpoints — a single Claude
  // call with no tool use finishes in a few seconds, no live progress to show.
  @Post('cover-letter')
  async generateCoverLetter(@Body() dto: GenerateCoverLetterDto) {
    try {
      const coverLetter = await this.tools.generateCoverLetter(dto.jobDescription);
      return { coverLetter };
    } catch (err) {
      // Single-admin tool, no one else to hide internals from — same
      // rationale as trends' pre-streaming BadGatewayException handling.
      throw new BadGatewayException(err instanceof Error ? err.message : 'Cover letter generation failed');
    }
  }
}
