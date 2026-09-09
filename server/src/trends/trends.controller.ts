import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateDraftsDto } from './dto/create-drafts.dto.js';
import { TrendsService } from './trends.service.js';

@Controller('trends')
@UseGuards(JwtAuthGuard)
export class TrendsController {
  constructor(private readonly trends: TrendsService) {}

  @Post('discover')
  discover() {
    return this.trends.discover();
  }

  @Post('drafts')
  createDrafts(@Body() dto: CreateDraftsDto) {
    return this.trends.createDrafts(dto.trends);
  }
}
