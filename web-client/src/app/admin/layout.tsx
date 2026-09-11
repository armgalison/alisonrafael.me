import type { ReactNode } from 'react'
import { AuthProvider } from '../../admin/AuthContext'

// Wraps the whole /admin/* tree — both /admin/login and everything in
// (protected) — matching the old AdminRoutes.tsx, where AuthProvider sat
// above both the login route and the ProtectedRoute-gated ones.
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
