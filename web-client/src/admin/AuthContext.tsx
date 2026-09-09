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
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY))
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
