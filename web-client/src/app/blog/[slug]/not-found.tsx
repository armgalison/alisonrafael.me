import Link from 'next/link'
import { blogListPath } from '../../../blog/routes'

// The nearest not-found.tsx up the segment tree handles notFound() calls
// from this route — colocating it here (rather than relying on the root
// one) keeps the Blog-specific "Post not found" copy and Back-to-Blog
// link, still wrapped in blog/layout.tsx's header/footer chrome.
export default async function PostNotFound() {
  const backToBlog = await blogListPath()
  return (
    <div className="flex flex-col gap-8 pt-[clamp(32px,5vw,56px)] pb-22">
      <Link href={backToBlog} className="self-start text-sm no-underline">
        ← Back to Blog
      </Link>
      <div className="flex flex-col gap-4">
        <p className="ind-label m-0">Error / 404</p>
        <h1 className="text-[clamp(40px,6vw,72px)] leading-[0.95]">Post not found.</h1>
        <p className="m-0 text-lg opacity-80">
          This post doesn't exist or hasn't been published. <Link href={backToBlog}>Back to Blog</Link>
        </p>
      </div>
    </div>
  )
}
