'use client'

import { ArrowLeft, FileText, RefreshCw } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { resumeDownloadUrl } from '../../lib/resumeUrl'
import { api, ApiError, type AtsResume } from '../api'
import { useAuth } from '../AuthContext'
import { useAdminContent } from '../i18n'

// Same SSR-escape-hatch reasoning as PostEditorPage.tsx: @uiw/react-md-editor
// touches browser APIs (CodeMirror) outside of just render time, which
// breaks under SSR even inside an already-'use client' page.
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

// Mirrors admin/pages/TrendsPage.tsx's formatRelativeTime — copied rather
// than shared for the same reason Comments.tsx copies it (see CLAUDE.md):
// a one-line algorithm doesn't carry the drift risk a data list does.
function formatRelativeTime(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export function ToolsAtsResumePage() {
  const { token } = useAuth()
  const content = useAdminContent()

  const [resume, setResume] = useState<AtsResume | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [markdown, setMarkdown] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [approving, setApproving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justApproved, setJustApproved] = useState(false)

  // Never triggers a new (paid) Claude call — mirrors TrendsPage.tsx
  // loading the last saved search on mount. Restores the job description
  // too, so reopening the tool shows what the last draft was tailored for.
  useEffect(() => {
    if (!token) return
    api
      .getLatestAtsResume(token)
      .then((latest) => {
        setResume(latest)
        setMarkdown(latest?.markdown ?? '')
        setJobDescription(latest?.jobDescription ?? '')
      })
      .finally(() => setLoading(false))
  }, [token])

  async function handleGenerate() {
    if (!token || !jobDescription.trim()) return
    setGenerating(true)
    setError(null)
    setJustApproved(false)
    try {
      const result = await api.generateAtsResume(token, jobDescription)
      setResume(result)
      setMarkdown(result.markdown)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : content.toolsAtsResume.generateError)
    } finally {
      setGenerating(false)
    }
  }

  async function handleApprove() {
    if (!token || !resume) return
    setApproving(true)
    setError(null)
    try {
      const result = await api.approveAtsResume(token, resume.id, markdown)
      setResume(result)
      setJustApproved(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : content.toolsAtsResume.approveError)
    } finally {
      setApproving(false)
    }
  }

  return (
    <div>
      <Link href="/admin/tools" className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-dim hover:text-ink">
        <ArrowLeft size={14} />
        {content.toolsAtsResume.backToTools}
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <FileText size={18} />
        </span>
        <div>
          <h1 className="text-xl font-semibold">{content.toolsAtsResume.heading}</h1>
          <p className="text-sm text-ink-dim">{content.toolsAtsResume.subtitle}</p>
        </div>
      </div>

      {!loading && (
        <>
          <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="ats-job-description">
            {content.toolsAtsResume.jobDescriptionLabel}
          </label>
          <textarea
            id="ats-job-description"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder={content.toolsAtsResume.jobDescriptionPlaceholder}
            rows={10}
            className="w-full rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm text-ink placeholder:text-ink-dim/60 focus:border-accent-dim focus:outline-none"
          />

          <div className="mt-4">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || !jobDescription.trim()}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-surface transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <RefreshCw size={14} className={generating ? 'animate-spin' : undefined} />
              {generating
                ? content.toolsAtsResume.generating
                : resume
                  ? content.toolsAtsResume.regenerate
                  : content.toolsAtsResume.generate}
            </button>
          </div>
        </>
      )}

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {!loading && !resume && !generating && !error && (
        <p className="mt-6 text-sm text-ink-dim">{content.toolsAtsResume.empty}</p>
      )}

      {resume && (
        <div className="mt-6">
          <span className="mb-1.5 block text-sm font-medium text-ink">{content.toolsAtsResume.contentLabel}</span>
          <div data-color-mode="dark">
            <MDEditor value={markdown} onChange={(value) => setMarkdown(value ?? '')} preview="live" height={420} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleApprove}
              disabled={approving || !markdown.trim()}
              className="inline-flex items-center gap-1.5 rounded-full border border-accent-dim px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
            >
              {approving ? content.toolsAtsResume.approving : content.toolsAtsResume.approve}
            </button>

            {justApproved && resume.approvedAt && (
              <span className="text-sm text-ink-dim">
                {content.toolsAtsResume.approvedPrefix} {formatRelativeTime(resume.approvedAt)} —{' '}
                <a href={resumeDownloadUrl} className="text-accent hover:underline">
                  {content.toolsAtsResume.viewLive}
                </a>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
