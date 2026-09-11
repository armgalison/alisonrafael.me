import { Calendar, Eye, MessageSquare, Newspaper } from 'lucide-react'
import Link from 'next/link'
import { blogApi } from '../../blog/api'
import { Reveal } from '../../components/Reveal'
import { SectionHeading } from '../../components/Section'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Server Component — fetches directly, no loading state needed (the page
// doesn't render until the data is ready). See docs/adr/0013.
export default async function BlogListPage() {
  const posts = await blogApi.listPosts({ cache: 'no-store' }).catch(() => null)

  if (!posts) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16">
        <SectionHeading title="Blog" icon={Newspaper} />
        <Reveal>
          <p className="text-sm text-red-400">Could not load posts right now. Please try again later.</p>
        </Reveal>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <SectionHeading title="Blog" icon={Newspaper} />

      {posts.length === 0 && (
        <Reveal>
          <p className="rounded-lg border border-dashed border-line px-4 py-10 text-center text-sm text-ink-dim">
            No posts published yet — check back soon.
          </p>
        </Reveal>
      )}

      {posts.length > 0 && (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {posts.map((post, index) => (
            <li key={post.id} className="h-full">
              <Reveal delay={index * 0.05} className="h-full">
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface-raised transition-colors hover:border-accent-dim/60"
                >
                  {post.coverImageUrl ? (
                    <div className="aspect-[16/9] overflow-hidden border-b border-line">
                      <img
                        src={post.coverImageUrl}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[16/9] items-center justify-center border-b border-line bg-surface">
                      <Newspaper size={20} className="text-ink-dim/30" />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-5">
                    {post.publishedAt && (
                      <p className="flex items-center gap-1.5 font-mono text-xs text-ink-dim">
                        <Calendar size={12} className="text-accent" />
                        {formatDate(post.publishedAt)}
                      </p>
                    )}
                    <h2 className="mt-2 text-lg font-semibold text-ink">{post.title}</h2>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-dim">{post.excerpt}</p>
                    <div className="flex-1" />
                    <div className="mt-4 flex items-center gap-4 font-mono text-xs text-ink-dim">
                      <span className="flex items-center gap-1">
                        <Eye size={12} />
                        {post.viewCount.toLocaleString('en-US')}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare size={12} />
                        {post.commentCount ?? 0}
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
