// A Trend is never persisted (see CONTEXT.md) — it only ever exists in an
// HTTP request/response body, round-tripped from /trends/discover back
// into /trends/drafts once the Admin picks which ones to turn into Posts.
export interface Trend {
  topic: string;
  summary: string;
  fullText: string;
}

export interface RankedTrend extends Trend {
  relevance: string;
}

export interface DraftResult {
  topic: string;
  status: 'created' | 'failed';
  postId?: string;
  slug?: string;
  error?: string;
}
