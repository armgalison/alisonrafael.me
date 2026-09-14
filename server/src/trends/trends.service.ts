import Anthropic from '@anthropic-ai/sdk';
import { techStackGroups } from '@portifolio/shared';
import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogService } from '../blog/blog.service.js';
import { TrendSearch } from './entities/trend-search.entity.js';
import { slugify } from './slugify.js';
import type { DraftResult, RankedTrend, Trend, TrendsStreamEvent } from './trend.interface.js';

// Sonnet for the two steps that need real judgment (synthesizing search
// results, writing a publishable draft); Haiku for the filter step, which
// is pure ranking against a given list — no need to pay for more than that.
const DISCOVERY_MODEL = 'claude-sonnet-5';
const FILTER_MODEL = 'claude-haiku-4-5-20251001';
const DRAFT_MODEL = 'claude-sonnet-5';

const MAX_SLUG_ATTEMPTS = 5;

// Called synchronously with each progress frame as a streamed Claude call
// runs — the controller wires this straight to an SSE `res.write(...)` (see
// ADR 0007's streaming addendum). Plain callback rather than an async
// generator: every method below just calls `emit(...)` as it goes and
// `return`s its final value normally, no `yield`/`yield*` bookkeeping.
type Emit = (event: TrendsStreamEvent) => void;

@Injectable()
export class TrendsService {
  private readonly logger = new Logger(TrendsService.name);
  private readonly client: Anthropic;

  constructor(
    config: ConfigService,
    private readonly blog: BlogService,
    @InjectRepository(TrendSearch) private readonly searches: Repository<TrendSearch>,
  ) {
    this.client = new Anthropic({ apiKey: config.getOrThrow<string>('ANTHROPIC_API_KEY') });
  }

  // Agent 1 + Agent 2, chained: ~15 candidates down to the 10 most
  // relevant to the Tech Stack. Deliberately cheap: no deep-dive writing
  // happens until a topic is actually selected (see createOneDraft). The
  // result is saved as a TrendSearch row so a later page visit can show it
  // again via getLatestSearch() without paying for a new run. Streams
  // Agent 1's thinking live (see ADR 0007's streaming addendum) — Agent 2
  // (Haiku 4.5, no thinking/effort support) only ever gets one status event.
  async discoverStream(emit: Emit, signal?: AbortSignal): Promise<void> {
    const candidates = await this.findTrendingTopics(emit, signal);
    emit({ type: 'status', phase: 'filtering', message: 'Ranking against your tech stack…' });
    const trends = await this.filterByStack(candidates);
    const saved = await this.searches.save(this.searches.create({ trends }));
    emit({ type: 'result', result: saved });
  }

  getLatestSearch(): Promise<TrendSearch | null> {
    return this.searches.findOne({ where: {}, order: { createdAt: 'DESC' } });
  }

  // Agent 3, once per selected Trend. Best-effort (see ADR 0007): one
  // failure never blocks the rest of the batch.
  async createDraftsStream(trends: Trend[], emit: Emit, signal?: AbortSignal): Promise<void> {
    for (const trend of trends) {
      emit({ type: 'status', phase: 'draft', message: `Writing "${trend.topic}"…`, topic: trend.topic });
      const result = await this.createOneDraft(trend, emit, signal);
      emit({ type: 'draft_result', result });
    }
  }

  private async findTrendingTopics(emit: Emit, signal?: AbortSignal): Promise<Trend[]> {
    const stream = this.client.messages.stream(
      {
        model: DISCOVERY_MODEL,
        max_tokens: 4000,
        output_config: { effort: 'medium' },
        thinking: { type: 'adaptive', display: 'summarized' },
        tools: [{ type: 'web_search_20260318', name: 'web_search', max_uses: 5 }],
        system: [
          {
            type: 'text',
            text:
              'You are a research assistant for a software engineer looking for their next blog post idea. ' +
              'Use web search to find what is genuinely drawing attention in software development right now — ' +
              'new tool, language, or framework releases, architecture and industry debates, notable incidents, ' +
              'and similar. Respond with ONLY a JSON array (no prose, no markdown code fences) of about 15 ' +
              'objects shaped as: {"topic": string, "summary": string (one or two sentences)}. Keep this brief — ' +
              'a short list of leads, not deep write-ups.',
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: 'Find the current top trending topics in software development.' }],
      },
      { signal },
    );
    await forwardThinkingEvents(stream, emit, 'discovery');
    return extractJson<Trend[]>(await stream.finalMessage(), 'trend discovery');
  }

  private async filterByStack(candidates: Trend[]): Promise<RankedTrend[]> {
    const stackDescription = techStackGroups.map((group) => `${group.label}: ${group.items.join(', ')}`).join('\n');

    const message = await this.client.messages.create({
      model: FILTER_MODEL,
      max_tokens: 4000,
      system: [
        {
          type: 'text',
          text:
            "You rank blog topic candidates by how relevant they are to a specific engineer's professional " +
            'skill set. Respond with ONLY a JSON array (no prose, no markdown code fences) of the 10 most ' +
            'relevant candidates from the ones given, ordered most-to-least relevant, each shaped as the input ' +
            'object plus an added "relevance" field: a one-sentence reason it fits this skill set. Do not ' +
            'invent new topics — only choose from what was given.',
          cache_control: { type: 'ephemeral' },
        },
      ],
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
  private async draftPost(
    trend: Trend,
    emit: Emit,
    signal?: AbortSignal,
  ): Promise<{ title: string; excerpt: string; content: string }> {
    const stream = this.client.messages.stream(
      {
        model: DRAFT_MODEL,
        max_tokens: 8000,
        output_config: { effort: 'medium' },
        thinking: { type: 'adaptive', display: 'summarized' },
        tools: [{ type: 'web_search_20260318', name: 'web_search', max_uses: 4 }],
        system: [
          {
            type: 'text',
            text:
              "You write blog posts for a software engineer's personal technical blog, in clear, direct " +
              'English, first-person where natural. Use web search to gather enough current detail on the ' +
              'topic to write something substantive and accurate, then respond with ONLY a JSON object (no ' +
              'prose, no markdown code fences) shaped as: {"title": string, "excerpt": string (one or two ' +
              'sentences), "content": string (the full post body in Markdown, roughly 500-800 words, with ' +
              'headings)}.',
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: `Write a blog post about "${trend.topic}".\n\nSummary: ${trend.summary}` }],
      },
      { signal },
    );
    await forwardThinkingEvents(stream, emit, 'draft', trend.topic);
    return extractJson<{ title: string; excerpt: string; content: string }>(await stream.finalMessage(), 'draft generation');
  }

  private async createOneDraft(trend: Trend, emit: Emit, signal?: AbortSignal): Promise<DraftResult> {
    let draft: { title: string; excerpt: string; content: string };
    try {
      draft = await this.draftPost(trend, emit, signal);
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

// Normalizes the two thinking-capable calls' (discovery, draft) stream
// events into TrendsStreamEvent: a `thinking` event per thinking_delta, and
// a `status` event both when Claude starts a web_search call and when the
// result comes back (that block arrives whole via content_block_start, not
// delta-streamed like text/thinking).
async function forwardThinkingEvents(
  stream: AsyncIterable<Anthropic.MessageStreamEvent>,
  emit: Emit,
  phase: 'discovery' | 'draft',
  topic?: string,
): Promise<void> {
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'thinking_delta') {
      emit({ type: 'thinking', phase, delta: event.delta.thinking, topic });
    } else if (event.type === 'content_block_start') {
      const block = event.content_block;
      if (block.type === 'server_tool_use' && block.name === 'web_search') {
        emit({ type: 'status', phase, message: 'Searching the web…', topic });
      } else if (block.type === 'web_search_tool_result') {
        const content = block.content;
        const message = Array.isArray(content)
          ? `Found ${content.length} result${content.length === 1 ? '' : 's'}`
          : `Search failed: ${content.error_code}`;
        emit({ type: 'status', phase, message, topic });
      }
    }
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
