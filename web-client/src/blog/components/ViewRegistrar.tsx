'use client'

import { useEffect, useRef } from 'react'
import { blogApi } from '../api'

// POST /posts/:slug/views must fire once per real browser page view (ADR
// 0010) — a Server Component render isn't that, so this stays a genuine
// client island, extracted out of the page component so the page itself
// can be a Server Component. Renders nothing.
export function ViewRegistrar({ slug }: { slug: string }) {
  // The slug we've already counted a view for this mount — stops React
  // StrictMode's dev double-invoke from double-counting. Every real
  // navigation still counts.
  const viewedSlug = useRef<string | null>(null)

  useEffect(() => {
    if (viewedSlug.current === slug) return
    viewedSlug.current = slug
    void blogApi.registerView(slug).catch(() => {})
  }, [slug])

  return null
}
