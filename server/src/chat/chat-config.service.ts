import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatConfig } from './entities/chat-config.entity.js';
import { ChatConfigVersion } from './entities/chat-config-version.entity.js';
import { ResumeProfileService } from '../resume-profile/resume-profile.service.js';

const DEFAULT_TEMPLATE = `You are Alison Rafael, a full-stack software engineer. Here's your professional profile:

**Name:** {name}
**Headline:** {headline}
**Skills:** {skills}
**Summary:** {summary}

You help visitors learn about my background, skills, projects, and expertise.
Guidelines:
- Keep responses concise (2-3 sentences), friendly, and professional
- Reference specific skills and experience from the profile when relevant
- If asked about specific projects, discuss them authentically from the resume
- If asked something outside your knowledge, offer to connect via email
- Maintain a conversational, approachable tone`;

@Injectable()
export class ChatConfigService {
  constructor(
    @InjectRepository(ChatConfig) private configs: Repository<ChatConfig>,
    @InjectRepository(ChatConfigVersion) private versions: Repository<ChatConfigVersion>,
    private profile: ResumeProfileService,
  ) {}

  async getOrInitialize(): Promise<ChatConfig> {
    let config = await this.configs.findOne({ where: { isActive: true } });

    if (!config) {
      config = this.configs.create({
        systemPromptTemplate: DEFAULT_TEMPLATE,
        isActive: true,
        description: 'Default system prompt for chat',
      });
      await this.configs.save(config);
    }

    return config;
  }

  async getRendered(): Promise<string> {
    const config = await this.getOrInitialize();
    const profile = await this.profile.get();

    const skills = profile?.skills?.map((s: any) => s.name).join(', ') || 'Full-stack Development';
    const headline = profile?.headline || 'Full-stack Software Engineer';
    const summary = profile?.summary || 'Experienced software engineer with full-stack expertise';

    return config.systemPromptTemplate
      .replace('{name}', profile?.fullName || 'Alison Rafael')
      .replace('{headline}', headline)
      .replace('{skills}', skills)
      .replace('{summary}', summary);
  }

  async getTemplate(): Promise<ChatConfig> {
    return this.getOrInitialize();
  }

  async updateTemplate(template: string, reason?: string): Promise<ChatConfig> {
    const config = await this.getOrInitialize();

    // Save to history
    const version = this.versions.create({
      configId: config.id,
      systemPromptTemplate: config.systemPromptTemplate,
      changeReason: reason || null,
    });
    await this.versions.save(version);

    // Update config
    config.systemPromptTemplate = template;
    config.updatedAt = new Date();
    return this.configs.save(config);
  }

  async getHistory(limit: number = 10): Promise<ChatConfigVersion[]> {
    const config = await this.getOrInitialize();
    return this.versions.find({
      where: { configId: config.id },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async resetToDefault(reason?: string): Promise<ChatConfig> {
    return this.updateTemplate(DEFAULT_TEMPLATE, reason || 'Reset to default');
  }

  async renderPreview(template: string): Promise<string> {
    const profile = await this.profile.get();

    const skills = profile?.skills?.map((s: any) => s.name).join(', ') || 'Full-stack Development';
    const headline = profile?.headline || 'Full-stack Software Engineer';
    const summary = profile?.summary || 'Experienced software engineer with full-stack expertise';

    return template
      .replace('{name}', profile?.fullName || 'Alison Rafael')
      .replace('{headline}', headline)
      .replace('{skills}', skills)
      .replace('{summary}', summary);
  }
}
