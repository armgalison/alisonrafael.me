import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { PageView } from './entities/page-view.entity.js';
import { IpLookupService } from './ip-lookup.service.js';
import { PageViewsController } from './page-views.controller.js';
import { PageViewsService } from './page-views.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([PageView]),
    // AuthModule re-exports PassportModule, which JwtAuthGuard needs.
    AuthModule,
  ],
  controllers: [PageViewsController],
  providers: [PageViewsService, IpLookupService],
})
export class PageViewsModule {}
