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

  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN', 'https://www.alisonrafael.me'),
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
}
bootstrap();
