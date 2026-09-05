import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-6 text-center text-ink">
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <Link to="/" className="text-sm text-ink-dim underline transition-colors hover:text-accent">
        Back to the resume
      </Link>
    </div>
  )
}
