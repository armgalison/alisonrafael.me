import { resumeProfile, type ResumeProfile } from '@portifolio/shared';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResumeProfileEntity } from './entities/resume-profile.entity.js';

@Injectable()
export class ResumeProfileService implements OnModuleInit {
  private readonly logger = new Logger(ResumeProfileService.name);

  constructor(
    @InjectRepository(ResumeProfileEntity) private readonly profiles: Repository<ResumeProfileEntity>,
  ) {}

  // Mirrors AuthService's admin seed: only ever runs once, the first time
  // there's no row yet, seeding from shared's static default so the switch
  // to DB-backed storage starts from today's real data instead of blank.
  async onModuleInit() {
    const existing = await this.profiles.count();
    if (existing > 0) return;
    await this.profiles.save(this.profiles.create({ data: resumeProfile }));
    this.logger.log('Seeded the Resume Profile from the bundled default.');
  }

  async get(): Promise<ResumeProfile> {
    const row = await this.profiles.findOne({ where: {} });
    // Can't happen outside a fresh DB mid-seed race — onModuleInit always
    // leaves exactly one row behind before the app finishes starting.
    return row?.data ?? resumeProfile;
  }

  async update(data: ResumeProfile): Promise<ResumeProfile> {
    const row = await this.profiles.findOne({ where: {} });
    const entity = row ?? this.profiles.create();
    entity.data = data;
    const saved = await this.profiles.save(entity);
    return saved.data;
  }
}
