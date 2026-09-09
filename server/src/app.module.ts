import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { BlogModule } from './blog/blog.module.js';
import { HealthController } from './health/health.controller.js';

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
        // No migration tooling yet — fine while the schema has no
        // production data to protect. Revisit before this matters.
        synchronize: true,
      }),
    }),
    AuthModule,
    BlogModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
