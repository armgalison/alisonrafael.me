import { Calendar, Newspaper } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Footer } from '../../components/Footer'
import { Nav } from '../../components/Nav'
import { Reveal } from '../../components/Reveal'
import { SectionHeading } from '../../components/Section'
import { useResumeContent } from '../../i18n'
import { blogApi, type Post } from '../api'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function BlogListPage() {
  const content = useResumeContent()
  const [posts, setPosts] = useState<Post[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    blogApi
      .listPosts()
      .then((data) => {
        if (!cancelled) setPosts(data)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load posts right now. Please try again later.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-screen bg-surface text-ink">
      <Nav content={content} />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <SectionHeading title="Blog" icon={Newspaper} />

        {error && (
          <Reveal>
            <p className="text-sm text-red-400">{error}</p>
          </Reveal>
        )}
        {!posts && !error && (
          <Reveal>
            <p className="text-sm text-ink-dim">Loading posts…</p>
          </Reveal>
        )}
        {posts?.length === 0 && (
          <Reveal>
            <p className="rounded-lg border border-dashed border-line px-4 py-10 text-center text-sm text-ink-dim">
              No posts published yet — check back soon.
            </p>
          </Reveal>
        )}

        <ul className="flex flex-col gap-4">
          {posts?.map((post, index) => (
            <Reveal key={post.id} delay={index * 0.05}>
              <li>
                <Link
                  to={`/blog/${post.slug}`}
                  className="block rounded-xl border border-line bg-surface-raised px-6 py-5 transition-colors hover:border-accent-dim/60"
                >
                  {post.publishedAt && (
                    <p className="flex items-center gap-1.5 font-mono text-xs text-ink-dim">
                      <Calendar size={12} className="text-accent" />
                      {formatDate(post.publishedAt)}
                    </p>
                  )}
                  <h2 className="mt-2 text-xl font-semibold text-ink">{post.title}</h2>
                  <p className="mt-2 leading-relaxed text-ink-dim">{post.excerpt}</p>
                </Link>
              </li>
            </Reveal>
          ))}
        </ul>
      </main>
      <Footer content={content} />
    </div>
  )
}
