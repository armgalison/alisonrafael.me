import { BLOG_ORIGIN } from '../blog/url'
import type { ResumeContent } from '../content/types'
import { resumeDownloadUrl } from '../lib/resumeUrl'

interface SiteHeaderProps {
  content: ResumeContent
  // Set by blog/layout.tsx, which always wraps the Blog route tree — on
  // blog.alisonrafael.me the browser-visible pathname is "/" or "/:slug"
  // (src/proxy.ts rewrites the "/blog" prefix away internally), so the
  // pathname alone can't say whether this is the Blog.
  section?: 'blog'
  // Absolute origin ("https://alisonrafael.me") to prefix the wordmark's home
  // link with. Passed by blog/layout.tsx only when rendered under
  // blog.alisonrafael.me, where a bare "/#top" would resolve on the blog's
  // own origin instead of going back to the resume. Empty anywhere
  // same-origin with the resume page.
  homeOrigin?: string
}

const outlined =
  'font-mono text-[0.66rem] font-semibold uppercase tracking-[0.06em] leading-none border border-ink px-[0.65rem] py-[0.6rem] transition-colors'

// Not sticky, no nav links: a wordmark, a one-line note, and two outlined
// controls, closed by a full-strength rule.
export function SiteHeader({ content, section, homeOrigin = '' }: SiteHeaderProps) {
  const isBlog = section === 'blog'
  const role = content.meta.headline.split(/[·\n]/)[0].trim()

  return (
    <header className="flex items-baseline justify-between gap-8 border-b border-rule px-(--gutter) pt-5 pb-[1.1rem]">
      <a
        href={`${homeOrigin}/#top`}
        className="mono-label text-[0.72rem] tracking-[0.11em] no-underline"
        aria-label={`${content.meta.name}, back to top`}
      >
        {content.meta.name.split(' ')[0]} {content.meta.name.split(' ').at(-1)}
      </a>

      <div className="flex items-center gap-4 max-[720px]:gap-2">
        <span className="mono-label max-w-80 text-right text-ink-dim max-[720px]:hidden">
          {role}
          <br />
          {content.meta.location}
        </span>
        <a
          href={BLOG_ORIGIN}
          className={`${outlined} ${isBlog ? 'bg-ink text-surface' : 'hover:bg-ink hover:text-surface'}`}
          aria-current={isBlog ? 'page' : undefined}
        >
          Blog
        </a>
        <a href={resumeDownloadUrl} download className={`${outlined} hover:bg-ink hover:text-surface`}>
          Resume ↓
        </a>
      </div>
    </header>
  )
}
