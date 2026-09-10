const API_URL = import.meta.env.VITE_API_URL as string

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
  published: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`)
  if (!res.ok) throw new ApiError(res.status, res.statusText)
  return (await res.json()) as T
}

export const blogApi = {
  // Newest-published-first, published posts only — see server/src/blog/.
  listPosts: () => request<Post[]>('/posts'),

  // 404s (as an ApiError with status 404) for an unknown or unpublished slug.
  getPost: (slug: string) => request<Post>(`/posts/${encodeURIComponent(slug)}`),
}
