'use client'

import { motion } from 'framer-motion'
import { LayoutDashboard, LogIn } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { easeOut } from '../../lib/motion'
import { ApiError } from '../api'
import { useAuth } from '../AuthContext'
import { useAdminContent } from '../i18n'
import { PasswordInput } from '../PasswordInput'

export function LoginPage() {
  const { token, login } = useAuth()
  const content = useAdminContent()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Already authenticated (e.g. navigated here directly) — bounce to the
  // panel. next/navigation has no <Navigate>-during-render equivalent for
  // Client Components, so this is an effect instead (same pattern as the
  // (protected) layout's own gate).
  useEffect(() => {
    if (token) router.replace('/admin/posts')
  }, [token, router])

  if (token) return null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      router.replace('/admin/posts')
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401 ? content.login.invalidCredentials : content.login.genericError,
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-6 text-ink">
      <div className="bg-grid-center pointer-events-none absolute inset-0" />
      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOut }}
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm rounded-2xl border border-line bg-surface-raised p-8 shadow-2xl shadow-black/40"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <LayoutDashboard size={22} />
          </span>
          <h1 className="text-lg font-semibold text-ink">{content.login.title}</h1>
          <p className="mt-1 text-sm text-ink-dim">{content.login.subtitle}</p>
        </div>

        <label className="mb-1 block text-sm text-ink-dim" htmlFor="email">
          {content.login.emailLabel}
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
          {content.login.passwordLabel}
        </label>
        <PasswordInput
          id="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6"
        />

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-surface transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <LogIn size={15} />
          {submitting ? content.login.submitting : content.login.submit}
        </button>
      </motion.form>
    </div>
  )
}
