'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Bare /admin/tools -> its first sub-page, which the sidebar's Tools group
// lists. A client redirect for the same reason as the /admin index page.
export default function ToolsIndexPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/tools/cover-letter')
  }, [router])
  return null
}
