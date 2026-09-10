import { motion } from 'framer-motion'
import { MessagesSquare } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { easeOut } from '../../lib/motion'
import { api, ApiError, type AdminComment, type CommentStatus } from '../api'
import { useAuth } from '../AuthContext'
import { useAdminContent } from '../i18n'
import { usePendingComments } from '../PendingCommentsContext'

function formatRelativeTime(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days <= 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

type Filter = CommentStatus | 'all'

const neutralBtn =
  'rounded-md border border-line px-3 py-1.5 text-sm transition-colors hover:border-accent-dim disabled:opacity-50'
const dangerBtn =
  'rounded-md border border-red-400/30 px-3 py-1.5 text-sm text-red-400/80 transition-colors hover:border-red-400 hover:bg-red-400/10 hover:text-red-400 disabled:opacity-50'

function statusPill(status: CommentStatus): string {
  if (status === 'approved') return 'bg-accent-soft text-accent'
  if (status === 'rejected') return 'border border-red-400/30 text-red-400/80'
  return 'border border-line text-ink-dim'
}

export function CommentsPage() {
  const { token } = useAuth()
  const content = useAdminContent()
  const { refreshPendingCount } = usePendingComments()

  const [comments, setComments] = useState<AdminComment[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('pending')
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setComments(null)
    setError(null)
    api
      .listComments(token, filter === 'all' ? undefined : filter)
      .then((data) => {
        if (!cancelled) setComments(data)
      })
      .catch(() => {
        if (!cancelled) setError(content.comments.loadError)
      })
    return () => {
      cancelled = true
    }
  }, [token, filter, content.comments.loadError])

  async function changeStatus(comment: AdminComment, status: CommentStatus) {
    if (!token) return
    setBusyId(comment.id)
    setError(null)
    try {
      const updated = await api.setCommentStatus(token, comment.id, status)
      setComments((prev) =>
        prev
          ? filter === 'all' || filter === status
            ? prev.map((c) => (c.id === updated.id ? updated : c))
            : prev.filter((c) => c.id !== updated.id)
          : prev,
      )
      await refreshPendingCount()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : content.comments.actionError)
    } finally {
      setBusyId(null)
    }
  }

  async function remove(comment: AdminComment) {
    if (!token) return
    if (!confirm(content.comments.deleteConfirm(comment.authorName))) return
    setBusyId(comment.id)
    setError(null)
    try {
      await api.deleteComment(token, comment.id)
      setComments((prev) => prev?.filter((c) => c.id !== comment.id) ?? prev)
      await refreshPendingCount()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : content.comments.actionError)
    } finally {
      setBusyId(null)
    }
  }

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: content.comments.filterAll },
    { key: 'pending', label: content.comments.filterPending },
    { key: 'approved', label: content.comments.filterApproved },
    { key: 'rejected', label: content.comments.filterRejected },
  ]

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <MessagesSquare size={18} />
        </span>
        <div>
          <h1 className="text-xl font-semibold">{content.comments.heading}</h1>
          <p className="text-sm text-ink-dim">{content.comments.subtitle}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              filter === f.key
                ? 'border-accent-dim text-accent'
                : 'border-line text-ink-dim hover:text-ink'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
      {!comments && !error && <p className="text-sm text-ink-dim">{content.comments.loading}</p>}
      {comments?.length === 0 && (
        <p className="rounded-lg border border-dashed border-line px-4 py-10 text-center text-sm text-ink-dim">
          {filter === 'pending' ? content.comments.emptyPending : content.comments.empty}
        </p>
      )}

      {comments && comments.length > 0 && (
        <ul className="flex flex-col gap-2">
          {comments.map((comment, index) => (
            <motion.li
              key={comment.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.03, ease: easeOut }}
              className="rounded-lg border border-line bg-surface-raised px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="font-medium text-ink">{comment.authorName}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusPill(comment.status)}`}>
                  {comment.status}
                </span>
                {comment.parentId && (
                  <span className="rounded-full border border-line px-2 py-0.5 text-xs text-ink-dim">
                    {content.comments.replyTag}
                  </span>
                )}
                <span className="font-mono text-xs text-ink-dim">{formatRelativeTime(comment.createdAt)}</span>
                <span className="text-xs text-ink-dim">
                  {content.comments.onPostPrefix}{' '}
                  <Link to={`/admin/posts/${comment.postId}`} className="underline hover:text-ink">
                    {comment.postTitle}
                  </Link>
                </span>
              </div>

              {comment.authorEmail && (
                <p className="mt-1 font-mono text-xs text-ink-dim">
                  {comment.authorEmail} · {content.comments.emailNote}
                </p>
              )}

              <p className="mt-2 whitespace-pre-wrap text-sm text-ink-dim">{comment.body}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {comment.status !== 'approved' && (
                  <button
                    type="button"
                    disabled={busyId === comment.id}
                    onClick={() => changeStatus(comment, 'approved')}
                    className={neutralBtn}
                  >
                    {content.comments.approve}
                  </button>
                )}
                {comment.status === 'approved' && (
                  <button
                    type="button"
                    disabled={busyId === comment.id}
                    onClick={() => changeStatus(comment, 'pending')}
                    className={neutralBtn}
                  >
                    {content.comments.unapprove}
                  </button>
                )}
                {comment.status === 'pending' && (
                  <button
                    type="button"
                    disabled={busyId === comment.id}
                    onClick={() => changeStatus(comment, 'rejected')}
                    className={dangerBtn}
                  >
                    {content.comments.reject}
                  </button>
                )}
                <button
                  type="button"
                  disabled={busyId === comment.id}
                  onClick={() => remove(comment)}
                  className={dangerBtn}
                >
                  {content.comments.delete}
                </button>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  )
}
