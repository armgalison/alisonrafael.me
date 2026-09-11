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

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    let message = res.statusText
    try {
      const data = (await res.json()) as { message?: string | string[] }
      if (data.message) message = Array.isArray(data.message) ? data.message.join(', ') : data.message
    } catch {
      // non-JSON error body — fall back to the status text already set
    }
    throw new ApiError(res.status, message)
  }

  if (res.status === 204) return undefined as T
  // NestJS sends an empty body (not literal "null") for a null/undefined
  // return value — res.json() throws on that, so check for content first
  // rather than assuming every 2xx response has a parseable body.
  const text = await res.text()
  if (!text) return null as T
  return JSON.parse(text) as T
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

  discoverTrends: (token: string) => request<TrendSearch>('/trends/discover', { method: 'POST' }, token),

  createDrafts: (token: string, trends: Trend[]) =>
    request<DraftResult[]>('/trends/drafts', { method: 'POST', body: JSON.stringify({ trends }) }, token),

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
}
