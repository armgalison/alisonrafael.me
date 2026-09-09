import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Post } from '../api'
import { useAuth } from '../AuthContext'

export function PostListPage() {
  const { token } = useAuth()
  const [posts, setPosts] = useState<Post[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    api
      .listPosts(token)
      .then((data) => setPosts(data.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))))
      .catch(() => setError('Falha ao carregar os posts.'))
  }, [token])

  async function handleDelete(post: Post) {
    if (!token) return
    if (!confirm(`Apagar "${post.title}"? Essa ação não pode ser desfeita.`)) return
    await api.deletePost(token, post.id)
    setPosts((prev) => prev?.filter((p) => p.id !== post.id) ?? null)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Posts</h1>
        <Link
          to="/admin/posts/new"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-surface transition-opacity hover:opacity-90"
        >
          Novo post
        </Link>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {!posts && !error && <p className="text-sm text-ink-dim">Carregando…</p>}
      {posts?.length === 0 && <p className="text-sm text-ink-dim">Nenhum post ainda.</p>}

      <ul className="flex flex-col gap-2">
        {posts?.map((post) => (
          <li
            key={post.id}
            className="flex items-center justify-between rounded-lg border border-line bg-surface-raised px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                  post.published
                    ? 'bg-accent-soft text-accent'
                    : 'bg-surface text-ink-dim border border-line'
                }`}
              >
                {post.published ? 'Publicado' : 'Rascunho'}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">{post.title}</p>
                <p className="truncate text-xs text-ink-dim">
                  /{post.slug} · atualizado em {new Date(post.updatedAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link
                to={`/admin/posts/${post.id}`}
                className="rounded-md border border-line px-3 py-1.5 text-sm transition-colors hover:border-accent-dim hover:text-ink"
              >
                Editar
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(post)}
                className="rounded-md border border-line px-3 py-1.5 text-sm text-ink-dim transition-colors hover:border-red-400 hover:text-red-400"
              >
                Apagar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
