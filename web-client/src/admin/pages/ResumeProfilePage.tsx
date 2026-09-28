'use client'

import { Save, UserRoundCog } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { api, type ResumeProfile } from '../api'
import { useAuth } from '../AuthContext'
import { useAdminContent } from '../i18n'
import { ResumeProfileForm } from '../resume-profile/ResumeProfileForm'

// `totalDuration` is optional in the DTO; an empty field means "none", so
// drop it rather than store an empty string the public page would render.
function normalize(profile: ResumeProfile): ResumeProfile {
  return {
    ...profile,
    experience: profile.experience.map(({ totalDuration, ...entry }) =>
      totalDuration?.trim() ? { ...entry, totalDuration } : entry,
    ),
  }
}

export function ResumeProfilePage() {
  const { token } = useAuth()
  const content = useAdminContent().resumeProfile
  const [profile, setProfile] = useState<ResumeProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saving' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .getResumeProfile()
      .then(setProfile)
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token || !profile) return
    setStatus('saving')
    setError(null)
    try {
      const saved = await api.updateResumeProfile(token, normalize(profile))
      setProfile(saved)
      // Best-effort — a failure here just means the public page waits out
      // its own cache lifetime instead of updating immediately; the save
      // itself already succeeded.
      fetch('/api/revalidate-resume', { method: 'POST' }).catch(() => {})
      setStatus('done')
    } catch {
      setError(content.saveError)
      setStatus('idle')
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <UserRoundCog size={18} />
        </span>
        <div>
          <h1 className="text-xl font-semibold">{content.heading}</h1>
          <p className="text-sm text-ink-dim">{content.subtitle}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-ink-dim">{content.loading}</p>
      ) : loadError || !profile ? (
        <p className="text-sm text-red-400">{content.loadError}</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <ResumeProfileForm
            value={profile}
            onChange={(next) => {
              setProfile(next)
              setStatus('idle')
            }}
          />

          <div className="sticky bottom-0 mt-6 flex flex-wrap items-center gap-4 border-t border-line bg-surface py-4">
            <button
              type="submit"
              disabled={status === 'saving'}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-surface transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Save size={14} />
              {status === 'saving' ? content.saving : content.save}
            </button>
            {error && <p className="text-sm text-red-400">{error}</p>}
            {status === 'done' && <p className="text-sm text-accent">{content.success}</p>}
          </div>
        </form>
      )}
    </div>
  )
}
