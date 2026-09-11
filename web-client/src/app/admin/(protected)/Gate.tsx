'use client'

import { useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { useAuth } from '../../../admin/AuthContext'

// Direct translation of the old ProtectedRoute.tsx: render null while
// loading or before redirecting (same as before — no flash of protected
// content), redirect to /admin/login when there's no token. App Router's
// Client Components have no <Navigate>-during-render equivalent, so the
// redirect is a useRouter().replace() inside an effect instead.
export function Gate({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !token) router.replace('/admin/login')
  }, [loading, token, router])

  if (loading || !token) return null
  return children
}
