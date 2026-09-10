import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Behind nginx-proxy: without this, req.protocol always reports 'http'
  // (the proxy talks to us over plain HTTP internally), which would make
  // the uploads controller build image URLs as http:// even in production.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // VIRTUAL_HOST in docker-compose.yml serves the site on both the apex
  // and www domains with no redirect between them, so both must be
  // allowed here too — a single origin string here would silently CORS-block
  // every API call (including login) from whichever domain isn't listed.
  const corsOrigins = config
    .get<string>('CORS_ORIGIN', 'https://alisonrafael.me,https://www.alisonrafael.me')
    .split(',')
    .map((origin) => origin.trim());
  app.enableCors({
    origin: corsOrigins,
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
}
bootstrap();
