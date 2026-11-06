'use client'

import { CornerDownRight } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Corners } from '../../components/home/Corners'
import { ApiError, blogApi, type BlogComment } from '../api'

// Fixed locale and time zone so the server and client renders match.
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

// A comment the visitor just posted. It is pending moderation (ADR 0009), so it is
// only shown in this browser, labelled as such, until the Admin approves it.
interface PendingComment {
  key: number
  authorName: string
  body: string
}

function CommentRow({ name, meta, body }: { name: string; meta: string; body: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="ind-heading text-lg">{name}</span>
        <span className="text-[13px] opacity-70">{meta}</span>
      </div>
      <p className="m-0 text-base leading-[1.6] break-words whitespace-pre-wrap">{body}</p>
    </div>
  )
}

const fieldClass = 'flex flex-col gap-1.5 text-[13px]'
const inputClass = 'input min-h-11 text-[15px]!'

function CommentForm({
  slug,
  parentId,
  onPosted,
}: {
  slug: string
  parentId?: string
  onPosted: (comment: PendingComment) => void
}) {
  const [authorName, setAuthorName] = useState('')
  const [authorEmail, setAuthorEmail] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const title = parentId ? 'Leave a reply' : 'Leave a comment'

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
      onPosted({ key: Date.now(), authorName: authorName.trim(), body: body.trim() })
      setAuthorName('')
      setAuthorEmail('')
      setBody('')
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
    <form onSubmit={handleSubmit} className="blueprint flex flex-col gap-3.5 p-5" aria-label={title}>
      <Corners />
      <h3 className="text-[22px]">{title}</h3>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-3.5">
        <label className={fieldClass}>
          Name
          <input
            className={inputClass}
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            maxLength={80}
            required
          />
        </label>
        <label className={fieldClass}>
          Email
          <input
            className={inputClass}
            type="email"
            value={authorEmail}
            onChange={(e) => setAuthorEmail(e.target.value)}
            maxLength={254}
          />
          <span className="text-xs opacity-70">Optional — never shown publicly.</span>
        </label>
      </div>
      <label className={fieldClass}>
        Comment
        <textarea
          className="input min-h-[120px] resize-y text-[15px]!"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={5000}
          required
        />
      </label>
      {error && (
        <p className="m-0 text-sm text-(--ind-accent-700)" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="btn btn-primary blueprint min-h-11 self-start px-[18px] text-[15px]!"
      >
        <Corners />
        {submitting ? 'Posting…' : parentId ? 'Post reply' : 'Post comment'}
      </button>
    </form>
  )
}

function PendingRow({ comment }: { comment: PendingComment }) {
  return <CommentRow name={comment.authorName} meta="Awaiting moderation" body={comment.body} />
}

function TopLevelComment({ slug, comment }: { slug: string; comment: BlogComment }) {
  const [replying, setReplying] = useState(false)
  const [pendingReplies, setPendingReplies] = useState<PendingComment[]>([])

  return (
    <li className="flex flex-col gap-3 border-t border-(--ind-divider) py-4">
      <CommentRow name={comment.authorName} meta={formatDate(comment.createdAt)} body={comment.body} />
      <button
        type="button"
        onClick={() => setReplying((v) => !v)}
        className="inline-flex cursor-pointer items-center gap-1 self-start border-0 bg-transparent p-0 text-[13px] text-(--ind-accent-700) hover:text-(--ind-accent-900)"
      >
        <CornerDownRight size={12} aria-hidden />
        {replying ? 'Cancel' : 'Reply'}
      </button>

      {(comment.replies.length > 0 || pendingReplies.length > 0) && (
        <ul className="m-0 flex list-none flex-col gap-4 border-l border-(--ind-divider) p-0 pl-4">
          {comment.replies.map((reply) => (
            <li key={reply.id}>
              <CommentRow name={reply.authorName} meta={formatDate(reply.createdAt)} body={reply.body} />
            </li>
          ))}
          {pendingReplies.map((reply) => (
            <li key={reply.key}>
              <PendingRow comment={reply} />
            </li>
          ))}
        </ul>
      )}

      {replying && (
        <CommentForm
          slug={slug}
          parentId={comment.id}
          onPosted={(reply) => {
            setPendingReplies((list) => [...list, reply])
            setReplying(false)
          }}
        />
      )}
    </li>
  )
}

// `initialComments` arrives already fetched by the Server Component parent
// (ADR 0013), so approved comments are in the initial HTML.
export function Comments({ slug, initialComments }: { slug: string; initialComments: BlogComment[] }) {
  const [pending, setPending] = useState<PendingComment[]>([])
  const isEmpty = initialComments.length === 0 && pending.length === 0

  return (
    <div className="flex min-w-0 max-w-[72ch] flex-[3_1_480px] flex-col gap-8">
      {isEmpty && <p className="m-0 text-base opacity-70">No comments yet — be the first.</p>}

      {!isEmpty && (
        <ul className="m-0 flex list-none flex-col p-0">
          {initialComments.map((comment) => (
            <TopLevelComment key={comment.id} slug={slug} comment={comment} />
          ))}
          {pending.map((comment) => (
            <li key={comment.key} className="border-t border-(--ind-divider) py-4">
              <PendingRow comment={comment} />
            </li>
          ))}
        </ul>
      )}

      <CommentForm slug={slug} onPosted={(comment) => setPending((list) => [...list, comment])} />
    </div>
  )
}
