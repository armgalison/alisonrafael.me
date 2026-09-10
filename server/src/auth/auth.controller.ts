import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const admin = await this.auth.validateAdmin(dto.email, dto.password);
    return this.auth.login(admin);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: AuthenticatedRequest) {
    const admin = await this.auth.findById(req.user.id);
    return { id: admin.id, email: admin.email };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(@Req() req: AuthenticatedRequest, @Body() dto: ChangePasswordDto) {
    await this.auth.changePassword(req.user.id, dto.currentPassword, dto.newPassword);
  }
}
