'use client'

import { KeyRound, UserRoundCog } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { api, ApiError, type ResumeProfile } from '../api'
import { useAuth } from '../AuthContext'
import { useAdminContent } from '../i18n'
import { PasswordInput } from '../PasswordInput'

export function SettingsPage() {
  const { token } = useAuth()
  const content = useAdminContent()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  const [profileJson, setProfileJson] = useState('')
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileLoadError, setProfileLoadError] = useState(false)
  const [profileStatus, setProfileStatus] = useState<'idle' | 'saving' | 'done'>('idle')
  const [profileError, setProfileError] = useState<string | null>(null)

  useEffect(() => {
    api
      .getResumeProfile()
      .then((profile) => setProfileJson(JSON.stringify(profile, null, 2)))
      .catch(() => setProfileLoadError(true))
      .finally(() => setProfileLoading(false))
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    setStatus('saving')
    setError(null)
    try {
      await api.changePassword(token, currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setStatus('done')
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? content.settings.incorrectPassword : content.settings.changeError)
      setStatus('idle')
    }
  }

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    setProfileStatus('saving')
    setProfileError(null)

    let parsed: ResumeProfile
    try {
      parsed = JSON.parse(profileJson) as ResumeProfile
    } catch {
      setProfileError(content.settings.resumeProfileInvalidJson)
      setProfileStatus('idle')
      return
    }

    try {
      const saved = await api.updateResumeProfile(token, parsed)
      setProfileJson(JSON.stringify(saved, null, 2))
      // Best-effort — a failure here just means the public page waits out
      // its own cache lifetime instead of updating immediately; the save
      // itself already succeeded.
      fetch('/api/revalidate-resume', { method: 'POST' }).catch(() => {})
      setProfileStatus('done')
    } catch {
      setProfileError(content.settings.resumeProfileSaveError)
      setProfileStatus('idle')
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-col items-center text-center">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <KeyRound size={22} />
        </span>
        <h1 className="text-xl font-semibold">{content.settings.heading}</h1>
        <p className="mt-1 text-sm text-ink-dim">{content.settings.subtitle}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-md rounded-xl border border-line bg-surface-raised p-6"
      >
        <div className="mb-5">
          <label className="mb-1 block text-sm text-ink-dim" htmlFor="currentPassword">
            {content.settings.currentPasswordLabel}
          </label>
          <PasswordInput
            id="currentPassword"
            required
            minLength={8}
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value)
              setStatus('idle')
            }}
          />
        </div>

        <div className="mb-5">
          <label className="mb-1 block text-sm text-ink-dim" htmlFor="newPassword">
            {content.settings.newPasswordLabel}
          </label>
          <PasswordInput
            id="newPassword"
            required
            minLength={8}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value)
              setStatus('idle')
            }}
          />
        </div>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        {status === 'done' && <p className="mb-4 text-sm text-accent">{content.settings.success}</p>}

        <button
          type="submit"
          disabled={status === 'saving'}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-surface transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <KeyRound size={14} />
          {status === 'saving' ? content.settings.submitting : content.settings.submit}
        </button>
      </form>

      <div className="mt-10 rounded-xl border border-line bg-surface-raised p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <UserRoundCog size={18} />
          </span>
          <div>
            <h2 className="font-semibold">{content.settings.resumeProfileHeading}</h2>
            <p className="text-sm text-ink-dim">{content.settings.resumeProfileSubtitle}</p>
          </div>
        </div>

        {profileLoading ? (
          <p className="text-sm text-ink-dim">{content.settings.resumeProfileLoading}</p>
        ) : profileLoadError ? (
          <p className="text-sm text-red-400">{content.settings.resumeProfileLoadError}</p>
        ) : (
          <form onSubmit={handleProfileSubmit}>
            <textarea
              value={profileJson}
              onChange={(e) => {
                setProfileJson(e.target.value)
                setProfileStatus('idle')
              }}
              spellCheck={false}
              rows={24}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 font-mono text-xs text-ink focus:border-accent-dim focus:outline-none"
            />

            {profileError && <p className="mt-3 text-sm text-red-400">{profileError}</p>}
            {profileStatus === 'done' && (
              <p className="mt-3 text-sm text-accent">{content.settings.resumeProfileSuccess}</p>
            )}

            <button
              type="submit"
              disabled={profileStatus === 'saving'}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-surface transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {profileStatus === 'saving' ? content.settings.resumeProfileSaving : content.settings.resumeProfileSave}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
