'use client'

import { ArrowLeft, Check, Copy, Download, FileEdit } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { api, ApiError, type ResumeProfile } from '../api'
import { useAuth } from '../AuthContext'
import { useAdminContent } from '../i18n'
import { downloadCoverLetterPdf } from '../lib/coverLetterPdf'

export function ToolsCoverLetterPage() {
  const { token } = useAuth()
  const content = useAdminContent()

  // name/location/contact links are Resume Profile data (now DB-backed,
  // see Settings' Resume Profile editor) — fetched live rather than from
  // the static useResumeContent(), which only holds UI copy now.
  const [profile, setProfile] = useState<ResumeProfile | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [coverLetter, setCoverLetter] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api.getResumeProfile().then(setProfile)
  }, [])

  async function handleGenerate() {
    if (!token || !jobDescription.trim()) return
    setGenerating(true)
    setError(null)
    setCoverLetter(null)
    setCopied(false)
    try {
      const result = await api.generateCoverLetter(token, jobDescription)
      setCoverLetter(result.coverLetter)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : content.toolsCoverLetter.generateError)
    } finally {
      setGenerating(false)
    }
  }

  async function handleCopy() {
    if (!coverLetter) return
    await navigator.clipboard.writeText(coverLetter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownloadPdf() {
    if (!coverLetter || !profile) return
    downloadCoverLetterPdf(coverLetter, {
      name: profile.name,
      location: profile.location,
      phone: profile.links.phone,
      email: profile.links.email,
      linkedinLabel: profile.links.linkedinLabel,
    })
  }

  return (
    <div>
      <Link href="/admin/tools" className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-dim hover:text-ink">
        <ArrowLeft size={14} />
        {content.toolsCoverLetter.backToTools}
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <FileEdit size={18} />
        </span>
        <div>
          <h1 className="text-xl font-semibold">{content.toolsCoverLetter.heading}</h1>
          <p className="text-sm text-ink-dim">{content.toolsCoverLetter.subtitle}</p>
        </div>
      </div>

      <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="job-description">
        {content.toolsCoverLetter.jobDescriptionLabel}
      </label>
      <textarea
        id="job-description"
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        placeholder={content.toolsCoverLetter.jobDescriptionPlaceholder}
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
          {generating ? content.toolsCoverLetter.generating : content.toolsCoverLetter.generate}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {!coverLetter && !generating && !error && (
        <p className="mt-6 text-sm text-ink-dim">{content.toolsCoverLetter.empty}</p>
      )}

      {coverLetter && (
        <div className="mt-6">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-medium text-ink">{content.toolsCoverLetter.resultHeading}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-accent-dim hover:text-accent"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? content.toolsCoverLetter.copied : content.toolsCoverLetter.copy}
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={!profile}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-accent-dim hover:text-accent disabled:opacity-50"
              >
                <Download size={13} />
                {content.toolsCoverLetter.downloadPdf}
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={coverLetter}
            rows={16}
            className="w-full rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm text-ink focus:outline-none"
          />
        </div>
      )}
    </div>
  )
}
