import Anthropic from '@anthropic-ai/sdk';
import { techStackGroups } from '@portifolio/shared';
import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlogService } from '../blog/blog.service.js';
import { slugify } from './slugify.js';
import type { DraftResult, RankedTrend, Trend } from './trend.interface.js';

// Sonnet for the two steps that need real judgment (synthesizing search
// results, writing a publishable draft); Haiku for the filter step, which
// is pure ranking against a given list — no need to pay for more than that.
const DISCOVERY_MODEL = 'claude-sonnet-5';
const FILTER_MODEL = 'claude-haiku-4-5-20251001';
const DRAFT_MODEL = 'claude-sonnet-5';

const MAX_SLUG_ATTEMPTS = 5;

@Injectable()
export class TrendsService {
  private readonly logger = new Logger(TrendsService.name);
  private readonly client: Anthropic;

  constructor(
    config: ConfigService,
    private readonly blog: BlogService,
  ) {
    this.client = new Anthropic({ apiKey: config.getOrThrow<string>('ANTHROPIC_API_KEY') });
  }

  // Agent 1 + Agent 2, chained: ~15 candidates down to the 10 most
  // relevant to the Tech Stack. Nothing here is persisted — see the Trend
  // definition in CONTEXT.md. Deliberately cheap: no deep-dive writing
  // happens until a topic is actually selected (see createOneDraft).
  async discover(): Promise<RankedTrend[]> {
    const candidates = await this.findTrendingTopics();
    return this.filterByStack(candidates);
  }

  // Agent 3, once per selected Trend. Best-effort (see ADR 0007): one
  // failure never blocks the rest of the batch.
  async createDrafts(trends: Trend[]): Promise<DraftResult[]> {
    const results: DraftResult[] = [];
    for (const trend of trends) {
      results.push(await this.createOneDraft(trend));
    }
    return results;
  }

  private async findTrendingTopics(): Promise<Trend[]> {
    const message = await this.client.messages.create({
      model: DISCOVERY_MODEL,
      max_tokens: 4000,
      tools: [{ type: 'web_search_20260318', name: 'web_search', max_uses: 5 }],
      system:
        'You are a research assistant for a software engineer looking for their next blog post idea. ' +
        'Use web search to find what is genuinely drawing attention in software development right now — ' +
        'new tool, language, or framework releases, architecture and industry debates, notable incidents, ' +
        'and similar. Respond with ONLY a JSON array (no prose, no markdown code fences) of about 15 ' +
        'objects shaped as: {"topic": string, "summary": string (one or two sentences)}. Keep this brief — ' +
        'a short list of leads, not deep write-ups.',
      messages: [{ role: 'user', content: 'Find the current top trending topics in software development.' }],
    });
    return extractJson<Trend[]>(message, 'trend discovery');
  }

  private async filterByStack(candidates: Trend[]): Promise<RankedTrend[]> {
    const stackDescription = techStackGroups.map((group) => `${group.label}: ${group.items.join(', ')}`).join('\n');

    const message = await this.client.messages.create({
      model: FILTER_MODEL,
      max_tokens: 4000,
      system:
        "You rank blog topic candidates by how relevant they are to a specific engineer's professional " +
        'skill set. Respond with ONLY a JSON array (no prose, no markdown code fences) of the 10 most ' +
        'relevant candidates from the ones given, ordered most-to-least relevant, each shaped as the input ' +
        'object plus an added "relevance" field: a one-sentence reason it fits this skill set. Do not ' +
        'invent new topics — only choose from what was given.',
      messages: [
        {
          role: 'user',
          content: `Engineer's skill set:\n${stackDescription}\n\nCandidate topics:\n${JSON.stringify(candidates)}`,
        },
      ],
    });
    return extractJson<RankedTrend[]>(message, 'stack relevance filter');
  }

  // Only runs for topics the Admin actually selected — this is where the
  // token spend that used to happen for all ~20 discovery candidates now
  // happens instead, bounded by however many the Admin picked.
  private async draftPost(trend: Trend): Promise<{ title: string; excerpt: string; content: string }> {
    const message = await this.client.messages.create({
      model: DRAFT_MODEL,
      max_tokens: 8000,
      tools: [{ type: 'web_search_20260318', name: 'web_search', max_uses: 4 }],
      system:
        "You write blog posts for a software engineer's personal technical blog, in clear, direct " +
        'English, first-person where natural. Use web search to gather enough current detail on the ' +
        'topic to write something substantive and accurate, then respond with ONLY a JSON object (no ' +
        'prose, no markdown code fences) shaped as: {"title": string, "excerpt": string (one or two ' +
        'sentences), "content": string (the full post body in Markdown, roughly 500-800 words, with ' +
        'headings)}.',
      messages: [{ role: 'user', content: `Write a blog post about "${trend.topic}".\n\nSummary: ${trend.summary}` }],
    });
    return extractJson<{ title: string; excerpt: string; content: string }>(message, 'draft generation');
  }

  private async createOneDraft(trend: Trend): Promise<DraftResult> {
    let draft: { title: string; excerpt: string; content: string };
    try {
      draft = await this.draftPost(trend);
    } catch (err) {
      this.logger.error(`Draft generation failed for "${trend.topic}"`, err instanceof Error ? err.stack : String(err));
      return { topic: trend.topic, status: 'failed', error: 'Draft generation failed' };
    }

    const baseSlug = slugify(draft.title);
    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
      const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
      try {
        const post = await this.blog.create({
          title: draft.title,
          slug,
          excerpt: draft.excerpt,
          content: draft.content,
          published: false,
        });
        return { topic: trend.topic, status: 'created', postId: post.id, slug: post.slug };
      } catch (err) {
        if (err instanceof ConflictException) continue;
        this.logger.error(`Failed to save draft for "${trend.topic}"`, err instanceof Error ? err.stack : String(err));
        return { topic: trend.topic, status: 'failed', error: 'Could not save the post' };
      }
    }
    return { topic: trend.topic, status: 'failed', error: 'Could not generate a unique slug' };
  }
}

function extractJson<T>(message: Anthropic.Message, step: string): T {
  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n');

  if (!text) {
    throw new Error(
      `Claude's response for ${step} had no text content (stop_reason: ${message.stop_reason}) — it may have ` +
        'used its whole turn on tool calls without producing a final answer. Try again, or reduce max_uses/scope.',
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    const start = text.search(/[[{]/);
    const end = Math.max(text.lastIndexOf(']'), text.lastIndexOf('}'));
    if (start === -1 || end === -1) {
      throw new Error(
        `No JSON found in Claude's response for ${step} (stop_reason: ${message.stop_reason}). Raw text: ${text.slice(0, 300)}`,
      );
    }
    try {
      return JSON.parse(text.slice(start, end + 1)) as T;
    } catch (err) {
      const reason =
        message.stop_reason === 'max_tokens'
          ? 'the response was cut off before finishing (hit max_tokens) — try again or reduce scope'
          : 'the extracted text was not valid JSON';
      throw new Error(`Failed to parse Claude's response for ${step}: ${reason}. ${err instanceof Error ? err.message : ''}`);
    }
  }
}
