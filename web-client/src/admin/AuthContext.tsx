'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from './api'

const TOKEN_STORAGE_KEY = 'admin.token'

interface AuthContextValue {
  token: string | null
  email: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  // 'use client' controls hydration, not whether this ever runs on the
  // server — Next.js still renders Client Components once server-side for
  // their initial HTML (ADR 0013), and localStorage doesn't exist there.
  // `loading` starts true regardless of this value, so the server pass and
  // the client's first (hydration) pass render identically either way — no
  // mismatch — and the real token is picked up when this re-runs in the
  // browser.
  const [token, setToken] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_STORAGE_KEY),
  )
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    api
      .me(token)
      .then((admin) => setEmail(admin.email))
      .catch(() => {
        // Token expired/invalid — drop it so ProtectedRoute sends the
        // admin back to /admin/login instead of looping on failed calls.
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  const login = useCallback(async (loginEmail: string, password: string) => {
    const { accessToken } = await api.login(loginEmail, password)
    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken)
    setEmail(loginEmail)
    setToken(accessToken)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken(null)
    setEmail(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, email, loading, login, logout }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
