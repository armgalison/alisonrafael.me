import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AtsResumeModule } from './ats-resume/ats-resume.module.js';
import { AuthModule } from './auth/auth.module.js';
import { BlogModule } from './blog/blog.module.js';
import { CommentsModule } from './comments/comments.module.js';
import { HealthController } from './health/health.controller.js';
import { LiveCursorsModule } from './live-cursors/live-cursors.module.js';
import { ResumeProfileModule } from './resume-profile/resume-profile.module.js';
import { ToolsModule } from './tools/tools.module.js';
import { TrendsModule } from './trends/trends.module.js';
import { UPLOADS_DIR, UPLOADS_ROUTE } from './uploads/uploads.constants.js';
import { UploadsModule } from './uploads/uploads.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Powers CommentsService.processOffensiveCheckQueue (the Jev retry
    // queue's @Interval sweep) — must be registered once, in the root
    // module, for @Interval/@Cron to be picked up anywhere in the app.
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mariadb',
        host: config.getOrThrow<string>('DB_HOST'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.getOrThrow<string>('DB_USER'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_NAME'),
        autoLoadEntities: true,
        // No migration tooling yet — fine while the schema has no
        // production data to protect. Revisit before this matters.
        synchronize: true,
      }),
    }),
    ServeStaticModule.forRoot({ rootPath: UPLOADS_DIR, serveRoot: UPLOADS_ROUTE }),
    AuthModule,
    BlogModule,
    CommentsModule,
    UploadsModule,
    TrendsModule,
    ToolsModule,
    AtsResumeModule,
    ResumeProfileModule,
    LiveCursorsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
