import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { Admin } from './entities/admin.entity.js';
import { JwtStrategy } from './jwt.strategy.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        // Must be a real `number`, not the string ConfigService actually
        // returns from process.env — jsonwebtoken treats a numeric
        // *string* here as milliseconds (via the `ms` package) but a
        // numeric *type* as seconds, so an unconverted "86400" silently
        // expired tokens in ~86s instead of a day.
        signOptions: { expiresIn: Number(config.get<string>('JWT_EXPIRES_IN_SECONDS', '86400')) },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  // PassportModule is re-exported so other modules can just import
  // AuthModule to use JwtAuthGuard, instead of each re-registering
  // PassportModule with the same 'jwt' default strategy themselves.
  exports: [AuthService, PassportModule],
})
export class AuthModule {}
