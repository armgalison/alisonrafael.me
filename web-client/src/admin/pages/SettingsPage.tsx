'use client'

import { KeyRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { api, ApiError } from '../api'
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

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6 flex flex-col items-center text-center">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <KeyRound size={22} />
        </span>
        <h1 className="text-xl font-semibold">{content.settings.heading}</h1>
        <p className="mt-1 text-sm text-ink-dim">{content.settings.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-line bg-surface-raised p-6">
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
    </div>
  )
}
