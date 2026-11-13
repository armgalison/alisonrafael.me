import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Admin } from './entities/admin.entity.js';
import { LoginRateLimiter } from './login-rate-limiter.js';

type PasswordChangedListener = (adminId: string) => Promise<void>;

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private readonly passwordChangedListeners: PasswordChangedListener[] = [];

  constructor(
    @InjectRepository(Admin) private readonly admins: Repository<Admin>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly loginLimiter: LoginRateLimiter,
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

  // validateAdmin behind the shared failed-login limit — the entry point for
  // every login form (the Admin Panel's and the Admin MCP's OAuth page).
  async authenticate(email: string, password: string, ip: string | undefined): Promise<Admin> {
    this.loginLimiter.assertAllowed(ip);
    try {
      const admin = await this.validateAdmin(email, password);
      this.loginLimiter.recordSuccess(ip);
      return admin;
    } catch (err) {
      if (err instanceof UnauthorizedException) this.loginLimiter.recordFailure(ip);
      throw err;
    }
  }

  // Lets another module react to a password change without AuthModule
  // depending on it — the Admin MCP revokes every Connected client here.
  onPasswordChanged(listener: PasswordChangedListener): void {
    this.passwordChangedListeners.push(listener);
  }

  login(admin: Admin) {
    const payload = { sub: admin.id, email: admin.email };
    return { accessToken: this.jwt.sign(payload) };
  }

  async findById(id: string): Promise<Admin> {
    const admin = await this.admins.findOne({ where: { id } });
    if (!admin) throw new NotFoundException('Admin not found');
    return admin;
  }

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    const admin = await this.findById(id);
    if (!(await bcrypt.compare(currentPassword, admin.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    admin.passwordHash = await bcrypt.hash(newPassword, 12);
    await this.admins.save(admin);
    for (const listener of this.passwordChangedListeners) await listener(admin.id);
  }
}
