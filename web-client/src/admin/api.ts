const API_URL = process.env.NEXT_PUBLIC_API_URL as string

export interface Post {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  coverImageUrl: string | null
  viewCount: number
  published: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface PostInput {
  title: string
  slug: string
  excerpt: string
  content: string
  coverImageUrl?: string | null
  published: boolean
}

export type CommentStatus = 'pending' | 'approved' | 'rejected'

export interface AdminComment {
  id: string
  authorName: string
  authorEmail: string | null
  body: string
  status: CommentStatus
  parentId: string | null
  postId: string
  postTitle: string
  postSlug: string
  createdAt: string
  updatedAt: string
}

// A Trend only ever lives in these request/response bodies — never
// persisted (see CONTEXT.md and ADR 0007). Deliberately just a topic +
// summary: the deep-dive write-up only happens for topics actually
// selected, inside the draft-creation step, not for every discovered
// candidate up front.
export interface Trend {
  topic: string
  summary: string
}

export interface RankedTrend extends Trend {
  relevance: string
}

// One saved "Get top trends" run — see CONTEXT.md's Trend definition and
// ADR 0007's persistence addendum. Unlike a bare Trend, this row *is*
// persisted, specifically so revisiting /admin/trends doesn't need to pay
// for a fresh search every time.
export interface TrendSearch {
  id: string
  trends: RankedTrend[]
  createdAt: string
}

export interface DraftResult {
  topic: string
  status: 'created' | 'failed'
  postId?: string
  slug?: string
  error?: string
}

// One SSE frame from /trends/discover or /trends/drafts — mirrors the
// server's TrendsStreamEvent (server/src/trends/trend.interface.ts),
// duplicated here the same way Trend/RankedTrend/DraftResult already are.
export type TrendsStreamEvent =
  | { type: 'thinking'; phase: 'discovery' | 'draft'; delta: string; topic?: string }
  | { type: 'status'; phase: 'discovery' | 'filtering' | 'draft'; message: string; topic?: string }
  | { type: 'result'; result: TrendSearch }
  | { type: 'draft_result'; result: DraftResult }
  | { type: 'error'; message: string }

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function buildHeaders(options: RequestInit, token?: string | null): Headers {
  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  return headers
}

async function throwOnError(res: Response): Promise<void> {
  if (res.ok) return
  let message = res.statusText
  try {
    const data = (await res.json()) as { message?: string | string[] }
    if (data.message) message = Array.isArray(data.message) ? data.message.join(', ') : data.message
  } catch {
    // non-JSON error body — fall back to the status text already set
  }
  throw new ApiError(res.status, message)
}

async function request<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { ...options, headers: buildHeaders(options, token) })
  await throwOnError(res)

  if (res.status === 204) return undefined as T
  // NestJS sends an empty body (not literal "null") for a null/undefined
  // return value — res.json() throws on that, so check for content first
  // rather than assuming every 2xx response has a parseable body.
  const text = await res.text()
  if (!text) return null as T
  return JSON.parse(text) as T
}

// Reads a Server-Sent Events response (fetch, not EventSource: the Admin
// API is Bearer-token auth, which EventSource can't send, and /trends/drafts
// needs a POST body, which EventSource can't send either). Buffers on the
// SSE `\n\n` frame boundary and parses each frame's `data: ` line as JSON.
async function streamSse<TEvent>(
  path: string,
  onEvent: (event: TEvent) => void,
  options: RequestInit = {},
  token?: string | null,
): Promise<void> {
  const res = await fetch(`${API_URL}${path}`, { ...options, headers: buildHeaders(options, token) })
  await throwOnError(res)
  if (!res.body) return

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const frames = buffer.split('\n\n')
    buffer = frames.pop() ?? ''
    for (const frame of frames) {
      const line = frame.split('\n').find((l) => l.startsWith('data: '))
      if (!line) continue
      onEvent(JSON.parse(line.slice('data: '.length)) as TEvent)
    }
  }
}

export const api = {
  login: (email: string, password: string) =>
    request<{ accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: (token: string) => request<{ id: string; email: string }>('/auth/me', {}, token),

  changePassword: (token: string, currentPassword: string, newPassword: string) =>
    request<void>(
      '/auth/me',
      { method: 'PATCH', body: JSON.stringify({ currentPassword, newPassword }) },
      token,
    ),

  listPosts: (token: string) => request<Post[]>('/posts/admin', {}, token),

  getPost: (token: string, id: string) => request<Post>(`/posts/admin/${id}`, {}, token),

  createPost: (token: string, input: PostInput) =>
    request<Post>('/posts/admin', { method: 'POST', body: JSON.stringify(input) }, token),

  updatePost: (token: string, id: string, input: Partial<PostInput>) =>
    request<Post>(`/posts/admin/${id}`, { method: 'PATCH', body: JSON.stringify(input) }, token),

  deletePost: (token: string, id: string) =>
    request<void>(`/posts/admin/${id}`, { method: 'DELETE' }, token),

  uploadImage: async (token: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return request<{ url: string }>('/uploads', { method: 'POST', body: formData }, token)
  },

  getLatestTrendSearch: (token: string) => request<TrendSearch | null>('/trends/searches/latest', {}, token),

  streamDiscoverTrends: (token: string, onEvent: (event: TrendsStreamEvent) => void) =>
    streamSse<TrendsStreamEvent>('/trends/discover', onEvent, { method: 'POST' }, token),

  streamCreateDrafts: (token: string, trends: Trend[], onEvent: (event: TrendsStreamEvent) => void) =>
    streamSse<TrendsStreamEvent>('/trends/drafts', onEvent, { method: 'POST', body: JSON.stringify({ trends }) }, token),

  listComments: (token: string, status?: CommentStatus) =>
    request<AdminComment[]>(`/posts/comments/admin${status ? `?status=${status}` : ''}`, {}, token),

  pendingCommentCount: (token: string) =>
    request<{ count: number }>('/posts/comments/admin/pending-count', {}, token),

  setCommentStatus: (token: string, id: string, status: CommentStatus) =>
    request<AdminComment>(
      `/posts/comments/admin/${id}/status`,
      { method: 'PATCH', body: JSON.stringify({ status }) },
      token,
    ),

  deleteComment: (token: string, id: string) =>
    request<void>(`/posts/comments/admin/${id}`, { method: 'DELETE' }, token),

  generateCoverLetter: (token: string, jobDescription: string) =>
    request<{ coverLetter: string }>(
      '/tools/cover-letter',
      { method: 'POST', body: JSON.stringify({ jobDescription }) },
      token,
    ),
}
