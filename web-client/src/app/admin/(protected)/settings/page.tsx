'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Bare /admin/settings -> its first sub-page, which the sidebar's Settings group
// lists. A client redirect for the same reason as the /admin index page.
export default function SettingsIndexPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/settings/password')
  }, [router])
  return null
}
