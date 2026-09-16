import Anthropic from '@anthropic-ai/sdk';
import type { ResumeProfile } from '@portifolio/shared';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResumeProfileService } from '../resume-profile/resume-profile.service.js';

// Sonnet: this is prose generation that needs real judgment about which
// parts of the resume to foreground for a given job description, not a
// pure-ranking or extraction step (see trends.service.ts's model choices).
const COVER_LETTER_MODEL = 'claude-sonnet-5';

@Injectable()
export class ToolsService {
  private readonly client: Anthropic;

  constructor(
    config: ConfigService,
    private readonly resumeProfile: ResumeProfileService,
  ) {
    this.client = new Anthropic({ apiKey: config.getOrThrow<string>('ANTHROPIC_API_KEY') });
  }

  async generateCoverLetter(jobDescription: string): Promise<string> {
    const profile = await this.resumeProfile.get();
    const message = await this.client.messages.create({
      model: COVER_LETTER_MODEL,
      max_tokens: 2000,
      system: [
        {
          type: 'text',
          text:
            'You write cover letters for a software engineer applying to jobs. Write in first person, in a ' +
            "direct, confident voice, grounded only in the candidate's real background below, never invented " +
            "achievements. Match the letter's focus to what the job description actually asks for instead of " +
            "restating the whole resume. Write like a person wrote it, not an AI: use plain, varied sentences, " +
            "never use an em dash (—), and skip stock phrases like \"I am excited to apply\" or \"I believe I " +
            'would be a great fit." Respond with ONLY the cover letter body (no subject line, no markdown ' +
            'formatting, no commentary before or after), three to five paragraphs, ready to send as-is.\n\n' +
            `Candidate background:\n${formatResumeProfile(profile)}`,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: `Job description:\n\n${jobDescription}` }],
    });
    return extractText(message);
  }
}

export function formatResumeProfile(profile: ResumeProfile): string {
  const experience = profile.experience
    .flatMap((entry) =>
      entry.roles.map((role) => `- ${role.title} at ${entry.company} (${role.period}): ${role.description}`),
    )
    .join('\n');
  const education = profile.education.map((entry) => `- ${entry.degree}, ${entry.school} (${entry.period})`).join('\n');
  const technologyGroups = profile.technologyGroups.map((group) => `${group.label}: ${group.items.join(', ')}`).join('\n');

  return [
    `Name: ${profile.name}`,
    `Headline: ${profile.headline}`,
    `Location: ${profile.location}`,
    `Top skills: ${profile.topSkills.join(', ')}`,
    `Technology stack:\n${technologyGroups}`,
    `Experience:\n${experience}`,
    `Education:\n${education}`,
    `Certifications: ${profile.certifications.join(', ')}`,
    `Languages: ${profile.languages.map((language) => `${language.name} (${language.level})`).join(', ')}`,
  ].join('\n\n');
}

export function extractText(message: Anthropic.Message): string {
  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();

  if (!text) {
    throw new Error(`Claude's response had no text content (stop_reason: ${message.stop_reason}).`);
  }
  return text;
}
