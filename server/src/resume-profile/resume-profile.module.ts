import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { ResumeProfileEntity } from './entities/resume-profile.entity.js';
import { ResumeProfileController } from './resume-profile.controller.js';
import { ResumeProfileService } from './resume-profile.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([ResumeProfileEntity]), AuthModule],
  controllers: [ResumeProfileController],
  providers: [ResumeProfileService],
  exports: [ResumeProfileService],
})
export class ResumeProfileModule {}
