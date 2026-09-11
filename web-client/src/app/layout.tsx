import type { ReactNode } from 'react'
import './globals.css'

// Placeholder — real <head>/metadata (favicons, fonts, site-wide og:/twitter:
// fallback tags) land in Phase 2 alongside the resume page. This phase is
// scaffolding only: confirm the Next.js build/dev server boots.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
