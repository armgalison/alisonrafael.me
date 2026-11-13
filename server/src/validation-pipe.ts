import { ValidationPipe } from '@nestjs/common';

// The app-wide ValidationPipe, shared by main.ts and the e2e suites so tests
// validate exactly like production: every DTO must declare every field.
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true });
}
