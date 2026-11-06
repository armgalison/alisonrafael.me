import type { Metadata } from 'next'
import Link from 'next/link'
import { blogApi } from '../../blog/api'
import { blogPathPrefix } from '../../blog/routes'
import { blogListUrl } from '../../blog/url'
import { LiveCursorOverlay } from '../../live-cursors/components/LiveCursorOverlay'
import { JsonLd } from '../../seo/JsonLd'
import { PERSON_ID, SITE_TITLE } from '../../seo/site'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const BLOG_TITLE = 'Blog'
const BLOG_DESCRIPTION =
  'Blog by Alison Rafael Marinho Gonçalves (Alison Rafael), Full Stack Software Engineer — notes on software engineering, AI-native development and the web.'

// Without this, the list page silently inherited the root layout's
// alternates.canonical: '/' — wrong even before the Blog moved to its own
// subdomain, and actively wrong now that "/" means something different
// depending on host.
// openGraph is set explicitly for the same reason: the inherited one
// pointed og:url at the resume.
export const metadata: Metadata = {
  title: BLOG_TITLE,
  description: BLOG_DESCRIPTION,
  alternates: { canonical: blogListUrl() },
  openGraph: {
    type: 'website',
    url: blogListUrl(),
    title: `${BLOG_TITLE} — Alison Rafael`,
    description: BLOG_DESCRIPTION,
    siteName: SITE_TITLE,
  },
}

// Server Component — fetches directly, no loading state needed (the page
// doesn't render until the data is ready). See docs/adr/0013.
export default async function BlogListPage() {
  const posts = await blogApi.listPosts({ cache: 'no-store' }).catch(() => null)
  const pathPrefix = await blogPathPrefix()

  return (
    <section className="flex flex-col gap-10 pt-[clamp(40px,7vw,88px)] pb-22">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Blog',
          url: blogListUrl(),
          name: `${BLOG_TITLE} — Alison Rafael`,
          description: BLOG_DESCRIPTION,
          author: { '@id': PERSON_ID },
        }}
      />
      <LiveCursorOverlay room="blog" />

      <div className="flex flex-col gap-2">
        <p className="ind-label m-0">{posts ? `Index / ${String(posts.length).padStart(2, '0')} posts` : 'Index'}</p>
        <h1 className="text-[clamp(56px,8vw,104px)] leading-[0.88]">Blog.</h1>
      </div>

      {!posts && <p className="m-0 text-base opacity-70">Could not load posts right now. Please try again later.</p>}

      {posts && posts.length === 0 && <p className="m-0 text-base opacity-70">No posts published yet — check back soon.</p>}

      {posts && posts.length > 0 && (
        <ol className="m-0 flex list-none flex-col border-b border-(--ind-divider) p-0">
          {posts.map((post) => (
            <li key={post.id} className="border-t border-(--ind-divider)">
              <Link
                href={`${pathPrefix}/${post.slug}`}
                className="-mx-3 flex flex-wrap gap-x-12 gap-y-3 px-3 py-7 text-(--ind-text)! no-underline hover:bg-(--ind-accent-100)"
              >
                <div className="flex flex-[1_1_200px] flex-col gap-1.5">
                  <span className="text-sm">{post.publishedAt ? formatDate(post.publishedAt) : 'Draft'}</span>
                  <span className="text-[13px] opacity-70">
                    {post.viewCount.toLocaleString('en-US')} views / {post.commentCount ?? 0} comments
                  </span>
                </div>
                <div className="flex min-w-0 flex-[3_1_480px] items-start gap-6">
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <h2 className="text-[28px] leading-[1.1] text-pretty">{post.title}</h2>
                    <p className="m-0 max-w-[72ch] text-base leading-[1.6] text-pretty opacity-85">{post.excerpt}</p>
                  </div>
                  <span aria-hidden className="text-[22px] leading-[1.2] text-(--ind-accent-700)">
                    →
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
