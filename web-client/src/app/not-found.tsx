import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-6 text-center text-ink">
      <p className="text-sm text-accent-dim">404</p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <Link href="/" className="text-sm text-ink-dim underline transition-colors hover:text-accent-dim">
        Back to the resume
      </Link>
    </main>
  )
}
