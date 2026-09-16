import { existsSync } from 'node:fs';
import { copyFile, writeFile } from 'node:fs/promises';
import Anthropic from '@anthropic-ai/sdk';
import type { ResumeLinks, ResumeProfile } from '@portifolio/shared';
import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResumeProfileService } from '../resume-profile/resume-profile.service.js';
import { extractText, formatResumeProfile } from '../tools/tools.service.js';
import { RESUME_PDF_PATH, RESUME_SEED_PATH } from './ats-resume.constants.js';
import { AtsResume } from './entities/ats-resume.entity.js';
import { renderResumePdf } from './render-resume-pdf.js';

// Sonnet: same reasoning as the Cover Letter Generator (see
// tools.service.ts) — deciding how to phrase and prioritize achievements
// for ATS keyword matching is a judgment call, not pure extraction.
const ATS_RESUME_MODEL = 'claude-sonnet-5';

@Injectable()
export class AtsResumeService implements OnModuleInit {
  private readonly logger = new Logger(AtsResumeService.name);
  private readonly client: Anthropic;

  constructor(
    config: ConfigService,
    @InjectRepository(AtsResume) private readonly resumes: Repository<AtsResume>,
    private readonly resumeProfile: ResumeProfileService,
  ) {
    this.client = new Anthropic({ apiKey: config.getOrThrow<string>('ANTHROPIC_API_KEY') });
  }

  // Mirrors AuthService's admin seed: only ever runs once, the first time
  // the persistent uploads volume has no resume.pdf yet, so the public
  // download link is never broken while waiting on the Admin to generate
  // and approve the first AI-written version (see ADR 0004/0010's local-
  // disk-and-accepted-simplicity reasoning, and the new ADR for this
  // feature).
  async onModuleInit() {
    if (existsSync(RESUME_PDF_PATH)) return;
    await copyFile(RESUME_SEED_PATH, RESUME_PDF_PATH);
    this.logger.log('Seeded resume.pdf from the bundled default — no AI-generated resume approved yet.');
  }

  getLatest(): Promise<AtsResume | null> {
    return this.resumes.findOne({ where: {}, order: { createdAt: 'DESC' } });
  }

  async generate(jobDescription: string): Promise<AtsResume> {
    const profile = await this.resumeProfile.get();
    const draft = await this.draftMarkdown(profile, jobDescription);
    const markdown = withContactLine(draft, profile.links);
    return this.resumes.save(this.resumes.create({ markdown, jobDescription, approvedAt: null }));
  }

  async approve(id: string, markdown: string): Promise<AtsResume> {
    const resume = await this.resumes.findOne({ where: { id } });
    if (!resume) throw new NotFoundException('Resume draft not found');

    const pdf = await renderResumePdf(markdown);
    await writeFile(RESUME_PDF_PATH, pdf);

    resume.markdown = markdown;
    resume.approvedAt = new Date();
    return this.resumes.save(resume);
  }

  private async draftMarkdown(profile: ResumeProfile, jobDescription: string): Promise<string> {
    const message = await this.client.messages.create({
      model: ATS_RESUME_MODEL,
      max_tokens: 3000,
      system: [
        {
          type: 'text',
          text:
            "You write ATS-optimized resumes for a software engineer, grounded only in the candidate's real " +
            'background below — never invented achievements, employers, dates, or skills. A job description ' +
            "is given below the candidate's background: emphasize, reorder, and phrase the candidate's real " +
            'experience and skills toward what that job actually asks for. Do not add, imply, or invent any ' +
            "employer, title, skill, achievement, or date that isn't in the candidate background given — only " +
            'reorganize and rephrase what is actually there; if the candidate has nothing relevant to a part ' +
            "of the job description, leave it out rather than stretching a real bullet to fit. Format the " +
            "ENTIRE response as plain Markdown using only: one '# ' line with the candidate's name, '## ' " +
            'lines for standard section headers (Summary, Skills, Experience, Education, Certifications — ' +
            "omit any section with nothing to say), '### ' lines for a job title/company/dates or " +
            "degree/school/dates line within a section, '- ' bullet lines for achievements, and plain " +
            "paragraph lines for a short professional summary. For each role under Experience, write 2 to 4 " +
            "'- ' bullet lines pulling out concrete, specific achievements from that role's description " +
            '(scope, scale, measurable impact, technologies used, what changed because of the work) instead ' +
            "of restating the description as a single summary paragraph — a bullet like 'Reduced critical " +
            "endpoint response times from seconds to milliseconds through load testing and system " +
            "improvements' is the target shape, not a paraphrase of the whole role. Do not add a contact-" +
            "info line (name/email/phone/links) beyond the '# ' name heading — contact details aren't part " +
            'of the data given and are added separately. Never use tables, images, multiple columns, or ' +
            'horizontal rules — this resume must parse cleanly as plain text for an Applicant Tracking ' +
            'System. Order experience most-recent-first, matching the given data. Respond with ONLY the ' +
            'resume in markdown — no commentary before or after, no code fences.' +
            `\n\nCandidate background:\n${formatResumeProfile(profile)}`,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: `Job description:\n\n${jobDescription}` }],
    });
    return extractText(message);
  }
}

// Claude is deliberately never given contact details (see the system prompt
// above) so it can't rephrase or drop them — this splices the real ones
// from the Resume Profile in as a plain line right under the name heading,
// the same "added separately" step the prompt promises but that never
// actually ran before this fix.
function withContactLine(markdown: string, links: ResumeLinks): string {
  const contactLine = [links.phone, links.email, links.linkedinLabel, links.githubLabel, links.websiteLabel]
    .filter(Boolean)
    .join('   ·   ');
  if (!contactLine) return markdown;

  const lines = markdown.split('\n');
  const headingIndex = lines.findIndex((line) => line.trim().startsWith('# '));
  if (headingIndex === -1) return markdown;

  lines.splice(headingIndex + 1, 0, contactLine);
  return lines.join('\n');
}
