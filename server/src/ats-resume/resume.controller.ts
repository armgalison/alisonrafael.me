import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { RESUME_PDF_PATH } from './ats-resume.constants.js';

// Public — this is what the site's "Download Resume" buttons link to
// (see web-client's src/lib/resumeUrl.ts). No guard: anyone can download
// the resume, same as the old static /resume.pdf.
@Controller('resume')
export class ResumeController {
  @Get()
  download(@Res() res: Response) {
    res.download(RESUME_PDF_PATH, 'Alison-Rafael-Marinho-Goncalves-Resume.pdf');
  }
}
