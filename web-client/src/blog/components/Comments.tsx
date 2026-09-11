'use client'

import { CornerDownRight } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { ApiError, blogApi, type BlogComment } from '../api'

// Local copy rather than a shared import — keeps the Blog chunk decoupled
// from the Admin one (ADR 0005), same as `formatDate` elsewhere. Falls back
// to an absolute date once a comment is more than ~30 days old.
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

const inputClass =
  'w-full rounded-md border border-line bg-surface-raised px-3 py-2 text-sm outline-none focus:border-accent-dim'

function CommentRow({ comment }: { comment: BlogComment }) {
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="font-medium text-ink">{comment.authorName}</span>
        <span className="font-mono text-xs text-ink-dim">{formatRelativeTime(comment.createdAt)}</span>
      </div>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink-dim">{comment.body}</p>
    </div>
  )
}

function CommentForm({
  slug,
  parentId,
  onDone,
}: {
  slug: string
  parentId?: string
  onDone?: () => void
}) {
  const [authorName, setAuthorName] = useState('')
  const [authorEmail, setAuthorEmail] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (done) {
    return (
      <p className="rounded-lg border border-dashed border-line px-4 py-3 text-sm text-ink-dim">
        Thanks — your comment is awaiting moderation and will appear once approved.
      </p>
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!authorName.trim() || !body.trim()) {
      setError('Name and comment are required.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await blogApi.createComment(slug, {
        authorName: authorName.trim(),
        authorEmail: authorEmail.trim() || undefined,
        body,
        parentId,
      })
      setDone(true)
      onDone?.()
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError("You're commenting too quickly. Please try again later.")
      } else {
        setError("Couldn't post your comment. Please try again.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className={inputClass}
          placeholder="Name"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          maxLength={80}
        />
        <div>
          <input
            className={inputClass}
            type="email"
            placeholder="Email"
            value={authorEmail}
            onChange={(e) => setAuthorEmail(e.target.value)}
            maxLength={254}
          />
          <span className="mt-1 block text-xs text-ink-dim">Optional — never shown publicly.</span>
        </div>
      </div>
      <textarea
        className={inputClass}
        placeholder={parentId ? 'Write a reply…' : 'Write a comment…'}
        rows={4}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={5000}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-surface transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Posting…' : parentId ? 'Post reply' : 'Post comment'}
        </button>
      </div>
    </form>
  )
}

function TopLevelComment({ slug, comment }: { slug: string; comment: BlogComment }) {
  const [replying, setReplying] = useState(false)

  return (
    <li>
      <CommentRow comment={comment} />
      <button
        type="button"
        onClick={() => setReplying((v) => !v)}
        className="mt-2 inline-flex items-center gap-1 text-xs text-ink-dim transition-colors hover:text-accent"
      >
        <CornerDownRight size={12} />
        {replying ? 'Cancel' : 'Reply'}
      </button>

      {replying && (
        <div className="mt-3">
          <CommentForm slug={slug} parentId={comment.id} onDone={() => setReplying(false)} />
        </div>
      )}

      {comment.replies.length > 0 && (
        <ul className="mt-4 flex flex-col gap-4 border-l border-line pl-4">
          {comment.replies.map((reply) => (
            <li key={reply.id}>
              <CommentRow comment={reply} />
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

// `initialComments` arrives already fetched by the Server Component parent
// (ADR 0013) — comment content is present in the initial HTML instead of
// loading in after a client-side fetch. There's no local list state to
// manage: a newly posted comment is pending moderation and never appears
// in this list until the Admin approves it and the page is loaded again,
// so nothing here ever needs to mutate `initialComments` after mount.
export function Comments({ slug, initialComments }: { slug: string; initialComments: BlogComment[] }) {
  return (
    <section>
      <h2 className="mb-6 text-2xl font-semibold text-ink">Comments</h2>

      {initialComments.length === 0 && (
        <p className="mb-8 text-sm text-ink-dim">No comments yet — be the first.</p>
      )}

      {initialComments.length > 0 && (
        <ul className="mb-10 flex flex-col gap-6">
          {initialComments.map((comment) => (
            <TopLevelComment key={comment.id} slug={slug} comment={comment} />
          ))}
        </ul>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink">Leave a comment</h3>
        <CommentForm slug={slug} />
      </div>
    </section>
  )
}
