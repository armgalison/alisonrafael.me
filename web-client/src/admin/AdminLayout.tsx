import { motion } from 'framer-motion'
import { FileText, LayoutDashboard, LogOut, Settings as SettingsIcon } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { easeOut } from '../lib/motion'
import { useAuth } from './AuthContext'
import { useAdminContent } from './i18n'

export function AdminLayout() {
  const { email, logout } = useAuth()
  const content = useAdminContent()
  const location = useLocation()

  const links = [
    { to: '/admin/posts', label: content.nav.posts, icon: FileText },
    { to: '/admin/settings', label: content.nav.settings, icon: SettingsIcon },
  ]

  return (
    <div className="min-h-screen bg-surface text-ink">
      <motion.header
        initial={{ y: -32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className="sticky top-0 z-50 border-b border-line/60 bg-surface/80 backdrop-blur-md"
      >
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 font-semibold tracking-tight text-ink">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <LayoutDashboard size={16} />
              </span>
              <span className="hidden font-mono text-sm sm:inline">{content.panel.title}</span>
            </span>

            <ul className="flex gap-1 text-sm text-ink-dim">
              {links.map((link) => {
                const active = location.pathname.startsWith(link.to)
                return (
                  <li key={link.to}>
                    <NavLink
                      to={link.to}
                      className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors hover:text-ink ${
                        active ? 'text-ink' : ''
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="admin-nav-active-pill"
                          className="absolute inset-0 rounded-full bg-surface-raised"
                          transition={{ duration: 0.3, ease: easeOut }}
                        />
                      )}
                      <link.icon size={14} className="relative" />
                      <span className="relative">{link.label}</span>
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-ink-dim sm:inline">{email}</span>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink-dim/40 px-3.5 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
            >
              <LogOut size={13} />
              {content.panel.logout}
            </button>
          </div>
        </div>
      </motion.header>
      <main className="mx-auto max-w-4xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  )
}
