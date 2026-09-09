import { motion } from 'framer-motion'
import { FilePlus, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { easeOut } from '../../lib/motion'
import { api, type Post } from '../api'
import { useAuth } from '../AuthContext'
import { useAdminContent } from '../i18n'

export function PostListPage() {
  const { token } = useAuth()
  const content = useAdminContent()
  const [posts, setPosts] = useState<Post[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    api
      .listPosts(token)
      .then((data) => setPosts(data.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))))
      .catch(() => setError(content.postList.loadError))
  }, [token, content.postList.loadError])

  async function handleDelete(post: Post) {
    if (!token) return
    if (!confirm(content.postList.deleteConfirm(post.title))) return
    await api.deletePost(token, post.id)
    setPosts((prev) => prev?.filter((p) => p.id !== post.id) ?? null)
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{content.postList.heading}</h1>
        <Link
          to="/admin/posts/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-surface transition-opacity hover:opacity-90"
        >
          <FilePlus size={15} />
          {content.postList.newPost}
        </Link>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {!posts && !error && <p className="text-sm text-ink-dim">{content.postList.loading}</p>}
      {posts?.length === 0 && (
        <p className="rounded-lg border border-dashed border-line px-4 py-10 text-center text-sm text-ink-dim">
          {content.postList.empty}
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {posts?.map((post, index) => (
          <motion.li
            key={post.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.03, ease: easeOut }}
            className="flex items-center justify-between rounded-lg border border-line bg-surface-raised px-4 py-3 transition-colors hover:border-line/80"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  post.published ? 'bg-accent-soft text-accent' : 'border border-line text-ink-dim'
                }`}
              >
                {post.published ? content.postList.published : content.postList.draft}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">{post.title}</p>
                <p className="truncate text-xs text-ink-dim">
                  /{post.slug} · {content.postList.updatedAtPrefix} {new Date(post.updatedAt).toLocaleDateString('en-US')}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link
                to={`/admin/posts/${post.id}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm transition-colors hover:border-accent-dim hover:text-ink"
              >
                <Pencil size={13} />
                {content.postList.edit}
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(post)}
                className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm text-ink-dim transition-colors hover:border-red-400 hover:text-red-400"
              >
                <Trash2 size={13} />
                {content.postList.delete}
              </button>
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}
