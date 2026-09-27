import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Ip, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreatePageViewDto } from './dto/create-page-view.dto.js';
import { ListPageViewsQueryDto, PageViewSummaryQueryDto } from './dto/list-page-views-query.dto.js';
import { PageViewRateLimitGuard } from './page-view-rate-limit.guard.js';
import { PageViewsService } from './page-views.service.js';

// Admin/literal routes first, matching the other controllers' convention.
@Controller('page-views')
export class PageViewsController {
  constructor(private readonly pageViews: PageViewsService) {}

  // --- Admin routes (the Access Log) ---

  @UseGuards(JwtAuthGuard)
  @Get('admin/summary')
  summary(@Query() query: PageViewSummaryQueryDto) {
    return this.pageViews.summary(query.days ?? 7);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin')
  list(@Query() query: ListPageViewsQueryDto) {
    return this.pageViews.list(query);
  }

  // --- Public route (the beacon) ---

  // Unauthenticated and forgeable by design, like POST /posts/:slug/views
  // (ADR 0019): the host comes from Origin, the path must be a public page
  // on that host, and the rate limit caps any one IP.
  @UseGuards(PageViewRateLimitGuard)
  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  async create(
    @Body() dto: CreatePageViewDto,
    @Headers('origin') origin: string | undefined,
    @Headers('user-agent') userAgent: string | undefined,
    @Ip() ip: string,
  ) {
    await this.pageViews.record(dto, origin, ip, userAgent);
  }
}
