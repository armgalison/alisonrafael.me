import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-start justify-center gap-6 bg-surface px-(--gutter) text-ink">
      <p className="mono-label text-ink-dim">Error / 404</p>
      <h1 className="font-serif text-[clamp(2.5rem,6vw,6rem)] leading-[0.94] font-normal tracking-[-0.06em]">Page not found.</h1>
      <Link href="/" className="mono-label underline decoration-1 underline-offset-[0.16em] hover:decoration-2">
        ← Back to the resume
      </Link>
    </main>
  )
}
