const API_URL = process.env.NEXT_PUBLIC_API_URL as string

// Mirrors the Post shape returned by the server's public /posts routes
// (see server/src/blog/). Deliberately separate from ../admin/api.ts's
// Post type — this is a small, public-only client with no auth concerns,
// and the two bundles must stay decoupled (see ADR 0005).
export interface Post {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  coverImageUrl: string | null
  viewCount: number
  // Only present on the list payload (GET /posts), not the detail one.
  commentCount?: number
  published: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

// Approved comment as returned by GET /posts/:slug/comments — no email,
// no status, one level of replies (see ADR 0009).
export interface BlogComment {
  id: string
  authorName: string
  body: string
  createdAt: string
  replies: BlogComment[]
}

export interface NewComment {
  authorName: string
  authorEmail?: string
  body: string
  parentId?: string
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function readError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string | string[] }
    if (data.message) return Array.isArray(data.message) ? data.message.join(', ') : data.message
  } catch {
    // non-JSON error body — fall through to status text
  }
  return res.statusText
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`)
  if (!res.ok) throw new ApiError(res.status, await readError(res))
  return (await res.json()) as T
}

async function send<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) throw new ApiError(res.status, await readError(res))
  if (res.status === 204) return undefined as T
  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}

export const blogApi = {
  // Newest-published-first, published posts only — see server/src/blog/.
  listPosts: () => request<Post[]>('/posts'),

  // 404s (as an ApiError with status 404) for an unknown or unpublished slug.
  getPost: (slug: string) => request<Post>(`/posts/${encodeURIComponent(slug)}`),

  // Fire-and-forget from the reading page's load effect. Un-deduplicated by
  // design (ADR 0010).
  registerView: (slug: string) => send<void>(`/posts/${encodeURIComponent(slug)}/views`),

  // Approved comments only, nested one level.
  listComments: (slug: string) => request<BlogComment[]>(`/posts/${encodeURIComponent(slug)}/comments`),

  // Creates a pending comment. Throws ApiError(429) when rate-limited.
  createComment: (slug: string, input: NewComment) =>
    send<{ id: string; status: 'pending' }>(`/posts/${encodeURIComponent(slug)}/comments`, input),
}
