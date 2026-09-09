import { Injectable, Logger, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Admin } from './entities/admin.entity.js';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(Admin) private readonly admins: Repository<Admin>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // Seed a single admin from env vars on first boot only — never overwrites
  // an existing admin, so a future password change (once there's a UI for
  // it) survives container restarts.
  async onModuleInit() {
    const existing = await this.admins.count();
    if (existing > 0) return;

    const email = this.config.get<string>('ADMIN_EMAIL');
    const password = this.config.get<string>('ADMIN_PASSWORD');
    if (!email || !password) {
      this.logger.warn('No admin exists and ADMIN_EMAIL/ADMIN_PASSWORD are not set — skipping seed.');
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await this.admins.save(this.admins.create({ email, passwordHash }));
    this.logger.log(`Seeded initial admin: ${email}`);
  }

  async validateAdmin(email: string, password: string): Promise<Admin> {
    const admin = await this.admins.findOne({ where: { email } });
    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return admin;
  }

  login(admin: Admin) {
    const payload = { sub: admin.id, email: admin.email };
    return { accessToken: this.jwt.sign(payload) };
  }
}
