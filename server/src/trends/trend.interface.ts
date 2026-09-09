// A Trend is never persisted (see CONTEXT.md) — it only ever exists in an
// HTTP request/response body, round-tripped from /trends/discover back
// into /trends/drafts once the Admin picks which ones to turn into Posts.
// Deliberately lightweight: the earlier version generated a full write-up
// for every discovered candidate up front, which burned tokens on ~20
// candidates only 1-2 of which ever get selected, and risked truncating
// before the model finished (see ADR 0007's addendum). The deep dive now
// happens only for the topics actually selected, inside Agent 3.
export interface Trend {
  topic: string;
  summary: string;
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
