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
import { PageViewsModule } from './page-views/page-views.module.js';
import { ResumeProfileModule } from './resume-profile/resume-profile.module.js';
import { ToolsModule } from './tools/tools.module.js';
import { TrendsModule } from './trends/trends.module.js';
import { UPLOADS_DIR, UPLOADS_ROUTE } from './uploads/uploads.constants.js';
import { UploadsModule } from './uploads/uploads.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
        // MariaDB fills CreateDateColumn/UpdateDateColumn with its own
        // CURRENT_TIMESTAMP, in UTC. mysql2's default ('local') would read
        // those back in the Node process's timezone — shifting every
        // timestamp on a non-UTC dev machine. Same result as before in
        // production, where every container already runs in UTC.
        timezone: 'Z',
        // No migration tooling yet — fine while the schema has no
        // production data to protect. Revisit before this matters.
        synchronize: true,
      }),
    }),
    // Page Views' daily retention purge (ADR 0019).
    ScheduleModule.forRoot(),
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
    PageViewsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
