'use client'

import { useEffect } from 'react'

// Nav's section links (e.g. "/#experience") are plain anchors so a click
// while already on "/" gets the browser's free native hash-scroll. But
// arriving here via a full navigation (e.g. from /blog) means the browser
// tries to scroll to the fragment before this page has rendered the target
// section, so that native scroll silently does nothing — this finishes the
// job once the section actually exists in the DOM. Extracted into its own
// client component so the resume page itself can stay a Server Component
// (App Router has no useLocation()/hash equivalent server-side).
export function HashScrollOnLoad() {
  useEffect(() => {
    if (!window.location.hash) return
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView()
    // Intentionally mount-only: this recovers the initial-navigation case
    // above. A hash change while already mounted (already on "/") is
    // handled by the browser's own native same-page scroll instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
