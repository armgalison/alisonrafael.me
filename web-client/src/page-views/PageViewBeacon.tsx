'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL as string
// AuthContext's key — duplicated rather than imported so the public bundle
// doesn't pull in the Admin Panel (ADR 0005).
const ADMIN_TOKEN_KEY = 'admin.token'

// Records one Page View per browser page load of a public page, including
// client-side navigation (ADR 0019). Mounted on the resume page and the
// Blog layout, never under /admin. Renders nothing.
export function PageViewBeacon() {
  // Only a trigger: the recorded path is window.location's, which on
  // blog.* differs from the rewritten route usePathname() may report.
  const pathname = usePathname()
  // Last URL recorded by this mount: skips StrictMode's dev double-invoke,
  // and is the referrer of the next client-side navigation (where
  // document.referrer still points at the page the session started from).
  const lastUrl = useRef<string | null>(null)

  useEffect(() => {
    const url = window.location.origin + window.location.pathname
    if (lastUrl.current === url) return
    const referrer = lastUrl.current ?? document.referrer
    lastUrl.current = url

    try {
      // The Admin's own visits stay out of the Access Log. Only works where
      // the token is visible — this origin's localStorage, not blog.*'s.
      if (localStorage.getItem(ADMIN_TOKEN_KEY)) return
    } catch {
      // storage blocked — treat as a Visitor
    }

    void fetch(`${API_URL}/page-views`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: window.location.pathname, ...(referrer ? { referrer } : {}) }),
      // Survives the page being closed or navigated away mid-request.
      keepalive: true,
    }).catch(() => {})
  }, [pathname])

  return null
}
