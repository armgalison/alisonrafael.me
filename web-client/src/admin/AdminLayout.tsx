import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function AdminLayout() {
  const { email, logout } = useAuth()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-1.5 text-sm transition-colors ${
      isActive ? 'bg-surface-raised text-ink' : 'text-ink-dim hover:text-ink'
    }`

  return (
    <div className="min-h-screen bg-surface text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <span className="font-mono text-sm text-accent">Admin Panel</span>
            <nav className="flex gap-1">
              <NavLink to="/admin/posts" className={linkClass}>
                Posts
              </NavLink>
              <NavLink to="/admin/settings" className={linkClass}>
                Settings
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm text-ink-dim">
            <span>{email}</span>
            <button
              type="button"
              onClick={logout}
              className="rounded-md border border-line px-3 py-1.5 transition-colors hover:border-accent-dim hover:text-ink"
            >
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
