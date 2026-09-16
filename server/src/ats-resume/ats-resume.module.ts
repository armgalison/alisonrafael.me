import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { ResumeProfileModule } from '../resume-profile/resume-profile.module.js';
import { AtsResumeController } from './ats-resume.controller.js';
import { AtsResumeService } from './ats-resume.service.js';
import { AtsResume } from './entities/ats-resume.entity.js';
import { ResumeController } from './resume.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([AtsResume]), AuthModule, ResumeProfileModule],
  controllers: [AtsResumeController, ResumeController],
  providers: [AtsResumeService],
})
export class AtsResumeModule {}
