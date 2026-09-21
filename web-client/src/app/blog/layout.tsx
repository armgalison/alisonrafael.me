import type { ReactNode } from 'react'
import { isOnBlogHost } from '../../blog/routes'
import { Footer } from '../../components/Footer'
import { SiteHeader } from '../../components/SiteHeader'
import { getResumeContent } from '../../i18n'

// Shared chrome for /blog and /blog/[slug] (including that segment's
// not-found fallback) — each page still owns its own <main> since the
// list and the detail view use different max-widths. Footer needs
// content.meta.name (Resume Profile data), so this fetches the full
// merged content like the resume page does, not just the static copy.
export default async function BlogLayout({ children }: { children: ReactNode }) {
  const content = await getResumeContent()
  // The header's wordmark links back to the resume ("/#top"). On
  // blog.alisonrafael.me that's relative to the wrong origin (it would
  // resolve to blog.alisonrafael.me/#top, which is the Blog itself), so the
  // header needs the resume site's absolute origin to prefix it with. Not
  // needed when this layout is reached directly at /blog (local dev, no
  // subdomain rewrite in play): there the resume page is already
  // same-origin, so a relative link is correct as-is.
  const homeOrigin = (await isOnBlogHost()) ? 'https://alisonrafael.me' : ''
  return (
    <div className="min-h-screen bg-surface text-ink">
      <SiteHeader content={content} section="blog" homeOrigin={homeOrigin} />
      {children}
      <Footer content={content} />
    </div>
  )
}
