import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

// The nearest not-found.tsx up the segment tree handles notFound() calls
// from this route — colocating it here (rather than relying on the root
// one) keeps the Blog-specific "Post not found" copy and Back-to-Blog
// link, still wrapped in blog/layout.tsx's Nav/Footer chrome.
export default function PostNotFound() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/blog"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-ink-dim transition-colors hover:text-accent"
      >
        <ArrowLeft size={14} />
        Back to Blog
      </Link>
      <div className="rounded-lg border border-dashed border-line px-6 py-12 text-center">
        <p className="font-mono text-sm text-accent">404</p>
        <h1 className="mt-2 text-xl font-semibold text-ink">Post not found</h1>
        <p className="mt-2 text-sm text-ink-dim">
          This post doesn't exist or hasn't been published.{' '}
          <Link href="/blog" className="text-accent underline underline-offset-2">
            Back to Blog
          </Link>
        </p>
      </div>
    </main>
  )
}
