'use client'

import type { ReactNode } from 'react'
import { AdminLayout } from '../../../admin/AdminLayout'
import { PendingCommentsProvider } from '../../../admin/PendingCommentsContext'
import { Gate } from './Gate'

// Everything under /admin/* except /admin/login lives in this (protected)
// route group (the parens don't affect the URL — /admin/posts still
// resolves, not /admin/(protected)/posts). AuthProvider lives one level up
// (src/app/admin/layout.tsx) since /admin/login needs it too — this layer
// is just the auth gate -> PendingCommentsProvider -> AdminLayout chrome.
export default function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  return (
    <Gate>
      <PendingCommentsProvider>
        <AdminLayout>{children}</AdminLayout>
      </PendingCommentsProvider>
    </Gate>
  )
}
