import type { ReactNode } from 'react'
import { blogListPath, isOnBlogHost } from '../../blog/routes'
import { HomeFooter } from '../../components/home/HomeFooter'
import { HomeHeader } from '../../components/home/HomeHeader'
import '../../components/home/industry.css'
import { getResumeContent } from '../../i18n'
import { PageViewBeacon } from '../../page-views/PageViewBeacon'

// Shared chrome for /blog and /blog/[slug] (including that segment's
// not-found fallback): the resume page's header, footer, theme and `.industry`
// tokens. The header needs Resume Profile data (name, headline, projects), so
// this fetches the full merged content like the resume page does.
export default async function BlogLayout({ children }: { children: ReactNode }) {
  const content = await getResumeContent()
  // The header's resume links ("#about", "#top"…) must leave the Blog. On
  // blog.alisonrafael.me that means the resume site's absolute origin; reached
  // directly at /blog (local dev, no subdomain rewrite) the resume is
  // same-origin, so "/" is enough.
  const resumeHref = (await isOnBlogHost()) ? 'https://alisonrafael.me/' : '/'
  const blogHref = await blogListPath()

  return (
    <div id="top" className="industry flex min-h-screen flex-col">
      {/* In the layout, not each page, so one mount sees every client-side
          navigation between the list and Posts. */}
      <PageViewBeacon />
      <HomeHeader content={content} resumeHref={resumeHref} blogHref={blogHref} />
      <main className="mx-auto box-border w-full max-w-[1200px] flex-1 px-[clamp(20px,4vw,48px)]">{children}</main>
      <HomeFooter content={content} />
    </div>
  )
}
