import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { AuthProvider } from '../../admin/AuthContext'

// robots.txt already disallows /admin/, but that only stops crawling — a
// linked admin URL could still be indexed without this.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

// Wraps the whole /admin/* tree — both /admin/login and everything in
// (protected) — matching the old AdminRoutes.tsx, where AuthProvider sat
// above both the login route and the ProtectedRoute-gated ones.
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
