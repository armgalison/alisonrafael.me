import { BadGatewayException, Body, Controller, Get, Logger, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateDraftsDto } from './dto/create-drafts.dto.js';
import { TrendsService } from './trends.service.js';

@Controller('trends')
@UseGuards(JwtAuthGuard)
export class TrendsController {
  private readonly logger = new Logger(TrendsController.name);

  constructor(private readonly trends: TrendsService) {}

  // The most recently saved search, if any — never triggers a new (paid)
  // Claude call. The Admin decides when that happens via POST /discover.
  @Get('searches/latest')
  getLatestSearch() {
    return this.trends.getLatestSearch();
  }

  @Post('discover')
  async discover() {
    try {
      return await this.trends.discover();
    } catch (err) {
      this.logger.error('discover() failed', err instanceof Error ? err.stack : String(err));
      // Surfaces the real reason (e.g. a truncated/malformed Claude
      // response) to the Admin instead of a generic 500 — this is a
      // single-admin tool, not a public API, so there's no one else to
      // leak internals to.
      throw new BadGatewayException(err instanceof Error ? err.message : 'Trend discovery failed');
    }
  }

  @Post('drafts')
  async createDrafts(@Body() dto: CreateDraftsDto) {
    try {
      return await this.trends.createDrafts(dto.trends);
    } catch (err) {
      this.logger.error('createDrafts() failed', err instanceof Error ? err.stack : String(err));
      throw new BadGatewayException(err instanceof Error ? err.message : 'Draft creation failed');
    }
  }
}
