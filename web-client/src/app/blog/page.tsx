import type { Metadata } from 'next'
import Link from 'next/link'
import { blogApi } from '../../blog/api'
import { blogPathPrefix } from '../../blog/routes'
import { blogListUrl } from '../../blog/url'
import { Section } from '../../components/Section'
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
  const hasPosts = !!posts && posts.length > 0

  return (
    <main>
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
      <Section
        index={posts ? `Index / ${String(posts.length).padStart(2, '0')} posts` : 'Index'}
        title="Blog."
        headingLevel="h1"
        flush={hasPosts}
      >
        {!posts && <p className="text-red-700">Could not load posts right now. Please try again later.</p>}

        {posts && posts.length === 0 && (
          <p className="text-[1.05rem] text-ink-dim">No posts published yet — check back soon.</p>
        )}

        {hasPosts && (
          <ul className="-mx-(--gutter) border-t border-rule">
            {posts.map((post) => (
              <li key={post.id} className="border-b border-rule last:border-b-0">
                <Link
                  href={`${pathPrefix}/${post.slug}`}
                  className="group grid items-baseline gap-x-5 gap-y-3 px-(--gutter) py-[clamp(1.5rem,3.2vw,3.2rem)] no-underline transition-colors hover:bg-ink hover:text-surface focus-visible:bg-ink focus-visible:text-surface focus-visible:outline-offset-[-5px] max-[720px]:grid-cols-[1fr_auto] min-[721px]:grid-cols-[minmax(9rem,0.4fr)_minmax(0,1.1fr)_minmax(16rem,1fr)_auto]"
                >
                  <span className="mono-label text-ink-dim group-hover:text-surface group-focus-visible:text-surface max-[720px]:col-span-full">
                    {post.publishedAt ? formatDate(post.publishedAt) : 'Draft'}
                    <span className="mt-1 block">
                      {post.viewCount.toLocaleString('en-US')} views / {post.commentCount ?? 0} comments
                    </span>
                  </span>
                  <span className="font-serif text-[clamp(1.75rem,3.5vw,4rem)] leading-[0.92] tracking-[-0.055em]">
                    {post.title}
                  </span>
                  <span className="line-clamp-3 max-w-[25rem] text-[0.95rem] leading-[1.35]">{post.excerpt}</span>
                  <span
                    aria-hidden
                    className="text-[1.4rem] leading-none transition-transform group-hover:translate-x-1.5 group-focus-visible:translate-x-1.5 max-[720px]:col-start-2 max-[720px]:row-span-2 max-[720px]:self-center"
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </main>
  )
}
