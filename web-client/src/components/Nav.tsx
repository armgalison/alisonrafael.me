'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Download, Menu, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { BLOG_ORIGIN } from '../blog/url'
import type { ResumeContent } from '../content/types'
import { useActiveSection } from '../hooks/useActiveSection'
import { easeOut } from '../lib/motion'
import { resumeDownloadUrl } from '../lib/resumeUrl'

interface NavProps {
  content: ResumeContent
  // Set by blog/layout.tsx, which always wraps the Blog route tree — needed
  // because on blog.alisonrafael.me the browser-visible pathname is "/" or
  // "/:slug" (src/proxy.ts rewrites the "/blog" prefix away internally), so
  // pathname alone can't distinguish "on the blog" from "on the resume".
  section?: 'blog'
  // Absolute origin ("https://alisonrafael.me") to prefix the home-page
  // anchors below with. Passed by blog/layout.tsx only when actually
  // rendered under blog.alisonrafael.me, where a bare "/#experience" would
  // resolve on the blog's own origin instead of navigating to the resume
  // site. Empty/omitted anywhere same-origin with the resume page (the
  // resume page itself, or /blog reached directly in local dev), where a
  // relative link is correct and simpler.
  homeOrigin?: string
}

export function Nav({ content, section, homeOrigin = '' }: NavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const isBlog = section === 'blog' || pathname.startsWith('/blog')
  const isHome = !isBlog && pathname === '/'

  // These are anchors into sections that only exist on the resume page
  // ("/"), so they always target "/#id" rather than a bare "#id" — clicked
  // from elsewhere (e.g. a blog page) that navigates home and scrolls;
  // clicked from "/" itself it still works via the browser's native
  // same-page hash-scroll behavior.
  const links: Array<{ href: string; id: string; label: string }> = [
    { href: `${homeOrigin}/#experience`, id: 'experience', label: content.nav.experience },
    { href: `${homeOrigin}/#skills`, id: 'skills', label: content.nav.skills },
    { href: `${homeOrigin}/#credentials`, id: 'credentials', label: content.nav.credentials },
    { href: `${homeOrigin}/#contact`, id: 'contact', label: content.nav.contact },
  ]

  // IntersectionObserver-driven section highlighting only makes sense on
  // the resume page itself — elsewhere there's nothing to observe, so
  // don't let its ids[0] fallback misleadingly highlight "Experience".
  const observedSection = useActiveSection(links.map((link) => link.id))
  const active = isHome ? observedSection : null

  return (
    <>
      <motion.header
        initial={{ y: -32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className="sticky top-0 z-50 border-b border-line/60 bg-surface/80 backdrop-blur-md"
      >
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <a href={`${homeOrigin}/#top`} className="flex items-center gap-2 font-semibold tracking-tight text-ink">
            <img src="/avatar.png" alt="" className="h-8 w-8 shrink-0 rounded-none object-cover" />
            <span className="hidden sm:inline">Alison Gonçalves</span>
          </a>

          <ul className="hidden gap-1 text-sm text-ink-dim sm:flex">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={`relative rounded-none px-3 py-1.5 transition-colors hover:text-ink ${
                    active === link.id ? 'text-ink' : ''
                  }`}
                >
                  {active === link.id && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-0 rounded-none bg-surface-raised"
                      transition={{ duration: 0.3, ease: easeOut }}
                    />
                  )}
                  <span className="relative">{link.label}</span>
                </a>
              </li>
            ))}
            <li>
              <a
                href={BLOG_ORIGIN}
                className={`relative rounded-none px-3 py-1.5 transition-colors hover:text-ink ${
                  isBlog ? 'text-ink' : ''
                }`}
              >
                {isBlog && (
                  <motion.span
                    layoutId="nav-active-pill"
                    className="absolute inset-0 rounded-none bg-surface-raised"
                    transition={{ duration: 0.3, ease: easeOut }}
                  />
                )}
                <span className="relative">Blog</span>
              </a>
            </li>
          </ul>

          <a
            href={resumeDownloadUrl}
            download
            className="hidden items-center gap-1.5 rounded-none border border-ink-dim/40 px-3.5 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-accent-dim hover:text-accent-dim sm:inline-flex"
          >
            <Download size={13} />
            Download Resume
          </a>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="relative z-10 flex h-9 w-9 items-center justify-center rounded-none border border-line text-ink sm:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-x-0 top-16 bottom-0 z-30 bg-surface/70 backdrop-blur-sm sm:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: easeOut }}
              className="fixed inset-x-0 top-16 z-40 border-b border-line/60 bg-surface sm:hidden"
            >
              <ul className="flex flex-col gap-1 px-6 py-4">
                {links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={`block rounded-none px-3 py-3 text-base font-medium ${
                        active === link.id ? 'text-accent-dim' : 'text-ink'
                      }`}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href={BLOG_ORIGIN}
                    onClick={() => setOpen(false)}
                    className={`block rounded-none px-3 py-3 text-base font-medium ${
                      isBlog ? 'text-accent-dim' : 'text-ink'
                    }`}
                  >
                    Blog
                  </a>
                </li>
              </ul>
              <div className="border-t border-line/60 px-6 py-4">
                <a
                  href={resumeDownloadUrl}
                  download
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-none bg-ink px-5 py-2.5 text-sm font-semibold text-surface"
                >
                  <Download size={15} />
                  Download Resume
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
