import type { ReactNode } from 'react'
import { Footer } from '../../components/Footer'
import { Nav } from '../../components/Nav'
import { useResumeContent } from '../../i18n'

// Shared chrome for /blog and /blog/[slug] (including that segment's
// not-found fallback) — each page still owns its own <main> since the
// list and the detail view use different max-widths.
export default function BlogLayout({ children }: { children: ReactNode }) {
  const content = useResumeContent()
  return (
    <div className="min-h-screen bg-surface text-ink">
      <Nav content={content} />
      {children}
      <Footer content={content} />
    </div>
  )
}
