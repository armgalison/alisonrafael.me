'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  ChevronDown,
  FileEdit,
  FileText,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Newspaper,
  Settings as SettingsIcon,
  Sparkles,
  TrendingUp,
  UserRoundCog,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { easeOut } from '../lib/motion'
import { useAuth } from './AuthContext'
import { useAdminContent } from './i18n'
import { usePendingComments } from './PendingCommentsContext'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  badge: number
}

interface NavGroup {
  id: string
  label: string
  icon: LucideIcon
  items: NavItem[]
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="relative ml-auto rounded-full bg-accent px-1.5 py-0.5 text-[10px] leading-none font-semibold text-surface">
      {count}
    </span>
  )
}

// The sidebar's contents, rendered twice: in the persistent desktop <aside>
// and in the mobile drawer. `pillId` keeps their active-item animations
// apart, since both can be mounted at once.
function Sidebar({
  groups,
  pillId,
  onNavigate,
}: {
  groups: NavGroup[]
  pillId: string
  onNavigate?: () => void
}) {
  const { email, logout } = useAuth()
  const content = useAdminContent()
  const pathname = usePathname()
  // A group the admin hasn't toggled is open exactly when it holds the
  // current page, so navigating into a collapsed group reveals it.
  const [toggled, setToggled] = useState<Record<string, boolean>>({})

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-2 px-5 font-semibold tracking-tight">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <LayoutDashboard size={16} />
        </span>
        <span className="text-sm">{content.panel.title}</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-1">
          {groups.map((group) => {
            const hasActive = group.items.some((item) => pathname.startsWith(item.to))
            const open = toggled[group.id] ?? hasActive
            const groupBadge = group.items.reduce((sum, item) => sum + item.badge, 0)
            return (
              <li key={group.id}>
                <button
                  type="button"
                  onClick={() => setToggled((t) => ({ ...t, [group.id]: !open }))}
                  aria-expanded={open}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:text-ink ${
                    hasActive ? 'text-ink' : 'text-ink-dim'
                  }`}
                >
                  <group.icon size={15} />
                  <span className="font-medium">{group.label}</span>
                  {!open && <Badge count={groupBadge} />}
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${open ? 'rotate-180' : ''} ${!open && groupBadge > 0 ? 'ml-1' : 'ml-auto'}`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: easeOut }}
                      className="overflow-hidden"
                    >
                      {group.items.map((item) => {
                        const active = pathname.startsWith(item.to)
                        return (
                          <li key={item.to}>
                            <Link
                              href={item.to}
                              onClick={onNavigate}
                              aria-current={active ? 'page' : undefined}
                              className={`relative my-0.5 ml-4 flex items-center gap-2 rounded-lg border-l border-line px-3 py-1.5 text-sm transition-colors hover:text-ink ${
                                active ? 'text-ink' : 'text-ink-dim'
                              }`}
                            >
                              {active && (
                                <motion.span
                                  layoutId={pillId}
                                  className="absolute inset-0 rounded-lg bg-surface-raised"
                                  transition={{ duration: 0.3, ease: easeOut }}
                                />
                              )}
                              <item.icon size={14} className="relative" />
                              <span className="relative">{item.label}</span>
                              <Badge count={item.badge} />
                            </Link>
                          </li>
                        )
                      })}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-line/60 px-5 py-4">
        {email && <p className="mb-3 truncate text-xs text-ink-dim">{email}</p>}
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-1.5 rounded-full border whitespace-nowrap border-ink-dim/40 px-3.5 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
        >
          <LogOut size={13} />
          {content.panel.logout}
        </button>
      </div>
    </div>
  )
}

// Renders `children` instead of an <Outlet/> — App Router passes the
// matched page as `children` to the layout that wraps it.
export function AdminLayout({ children }: { children: ReactNode }) {
  const content = useAdminContent()
  const { pendingCount } = usePendingComments()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const groups: NavGroup[] = [
    {
      id: 'blog',
      label: content.nav.blog,
      icon: Newspaper,
      items: [
        { to: '/admin/posts', label: content.nav.posts, icon: FileText, badge: 0 },
        { to: '/admin/comments', label: content.nav.comments, icon: MessageSquare, badge: pendingCount },
      ],
    },
    {
      id: 'observability',
      label: content.nav.observability,
      icon: Activity,
      items: [{ to: '/admin/access-log', label: content.nav.accessLog, icon: Activity, badge: 0 }],
    },
    {
      id: 'tools',
      label: content.nav.tools,
      icon: Wrench,
      items: [
        { to: '/admin/tools/cover-letter', label: content.nav.coverLetter, icon: FileEdit, badge: 0 },
        { to: '/admin/tools/trends', label: content.nav.trends, icon: TrendingUp, badge: 0 },
        { to: '/admin/tools/ats-resume', label: content.nav.atsResume, icon: Sparkles, badge: 0 },
      ],
    },
    {
      id: 'settings',
      label: content.nav.settings,
      icon: SettingsIcon,
      items: [
        { to: '/admin/settings/password', label: content.nav.changePassword, icon: KeyRound, badge: 0 },
        { to: '/admin/settings/resume-profile', label: content.nav.resumeProfile, icon: UserRoundCog, badge: 0 },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-surface text-ink md:flex">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-line/60 md:block">
        <Sidebar groups={groups} pillId="admin-nav-active-pill" />
      </aside>

      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-line/60 bg-surface/80 px-4 backdrop-blur-md md:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label={content.nav.openMenu}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-dim hover:text-ink"
        >
          <Menu size={18} />
        </button>
        <span className="text-sm font-semibold tracking-tight">{content.panel.title}</span>
      </header>

      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-black/50"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: easeOut }}
              className="absolute inset-y-0 left-0 w-64 border-r border-line bg-surface"
            >
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label={content.nav.closeMenu}
                className="absolute top-4 right-3 flex h-8 w-8 items-center justify-center rounded-lg text-ink-dim hover:text-ink"
              >
                <X size={16} />
              </button>
              <Sidebar groups={groups} pillId="admin-nav-active-pill-mobile" onNavigate={() => setDrawerOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-4xl px-6 py-10">{children}</div>
      </main>
    </div>
  )
}
