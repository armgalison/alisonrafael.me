import Link from 'next/link'
import { blogListPath } from '../../../blog/routes'

// The nearest not-found.tsx up the segment tree handles notFound() calls
// from this route — colocating it here (rather than relying on the root
// one) keeps the Blog-specific "Post not found" copy and Back-to-Blog
// link, still wrapped in blog/layout.tsx's header/Footer chrome.
export default async function PostNotFound() {
  const backToBlog = await blogListPath()
  return (
    <main className="border-b border-rule px-(--gutter) py-[clamp(2rem,4vw,4rem)]">
      <Link
        href={backToBlog}
        className="mono-label underline decoration-1 underline-offset-[0.16em] hover:decoration-2"
      >
        ← Back to Blog
      </Link>
      <div className="mt-[clamp(3rem,8vw,7rem)]">
        <p className="mono-label text-ink-dim">Error / 404</p>
        <h1 className="mt-6 font-serif text-[clamp(2.5rem,6vw,6rem)] leading-[0.94] font-normal tracking-[-0.06em]">Post not found.</h1>
        <p className="mt-6 text-[1.05rem] text-ink-dim">
          This post doesn't exist or hasn't been published.{' '}
          <Link href={backToBlog} className="text-ink underline underline-offset-[0.16em]">
            Back to Blog
          </Link>
        </p>
      </div>
    </main>
  )
}
