import { useState, type FormEvent } from 'react'
import { api, ApiError } from '../api'
import { useAuth } from '../AuthContext'

export function SettingsPage() {
  const { token } = useAuth()
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
      setError(
        err instanceof ApiError && err.status === 401 ? 'Senha atual incorreta.' : 'Falha ao trocar a senha.',
      )
      setStatus('idle')
    }
  }

  return (
    <div className="max-w-sm">
      <h1 className="mb-6 text-xl font-semibold">Configurações</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm text-ink-dim" htmlFor="currentPassword">
            Senha atual
          </label>
          <input
            id="currentPassword"
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value)
              setStatus('idle')
            }}
            className="w-full rounded-md border border-line bg-surface-raised px-3 py-2 text-sm outline-none focus:border-accent-dim"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-ink-dim" htmlFor="newPassword">
            Nova senha
          </label>
          <input
            id="newPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value)
              setStatus('idle')
            }}
            className="w-full rounded-md border border-line bg-surface-raised px-3 py-2 text-sm outline-none focus:border-accent-dim"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {status === 'done' && <p className="text-sm text-accent">Senha atualizada.</p>}

        <button
          type="submit"
          disabled={status === 'saving'}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {status === 'saving' ? 'Salvando…' : 'Trocar senha'}
        </button>
      </form>
    </div>
  )
}
