import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../api'
import { useAuth } from '../AuthContext'

export function LoginPage() {
  const { token, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (token) {
    const from = (location.state as { from?: string } | null)?.from ?? '/admin/posts'
    return <Navigate to={from} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/admin/posts', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? 'Email ou senha incorretos.' : 'Falha ao entrar. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6 text-ink">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-line bg-surface-raised p-8"
      >
        <h1 className="mb-6 font-mono text-lg text-accent">Admin Panel</h1>

        <label className="mb-1 block text-sm text-ink-dim" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent-dim"
        />

        <label className="mb-1 block text-sm text-ink-dim" htmlFor="password">
          Senha
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent-dim"
        />

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
