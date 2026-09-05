import { AnimatePresence, motion } from 'framer-motion'
import { Download, Menu, X } from 'lucide-react'
import { useState } from 'react'
import type { ResumeContent } from '../content/types'
import { useActiveSection } from '../hooks/useActiveSection'
import { easeOut } from '../lib/motion'

interface NavProps {
  content: ResumeContent
}

export function Nav({ content }: NavProps) {
  const [open, setOpen] = useState(false)

  const links: Array<{ href: string; id: string; label: string }> = [
    { href: '#experience', id: 'experience', label: content.nav.experience },
    { href: '#skills', id: 'skills', label: content.nav.skills },
    { href: '#credentials', id: 'credentials', label: content.nav.credentials },
    { href: '#contact', id: 'contact', label: content.nav.contact },
  ]

  const active = useActiveSection(links.map((link) => link.id))

  return (
    <>
      <motion.header
        initial={{ y: -32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className="sticky top-0 z-50 border-b border-line/60 bg-surface/80 backdrop-blur-md"
      >
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <a href="#top" className="flex items-center gap-2 font-semibold tracking-tight text-ink">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 font-mono text-sm text-accent">
              AG
            </span>
            <span className="hidden sm:inline">Alison Gonçalves</span>
          </a>

          <ul className="hidden gap-1 text-sm text-ink-dim sm:flex">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={`relative rounded-full px-3 py-1.5 transition-colors hover:text-ink ${
                    active === link.id ? 'text-ink' : ''
                  }`}
                >
                  {active === link.id && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-0 rounded-full bg-surface-raised"
                      transition={{ duration: 0.3, ease: easeOut }}
                    />
                  )}
                  <span className="relative">{link.label}</span>
                </a>
              </li>
            ))}
          </ul>

          <a
            href="/resume.pdf"
            download
            className="hidden items-center gap-1.5 rounded-full border border-ink-dim/40 px-3.5 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-accent hover:text-accent sm:inline-flex"
          >
            <Download size={13} />
            Download Resume
          </a>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="relative z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink sm:hidden"
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
              className="fixed inset-x-0 top-16 z-40 border-b border-line/60 bg-surface shadow-xl shadow-black/40 sm:hidden"
            >
              <ul className="flex flex-col gap-1 px-6 py-4">
                {links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={`block rounded-lg px-3 py-3 text-base font-medium ${
                        active === link.id ? 'text-accent' : 'text-ink'
                      }`}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="border-t border-line/60 px-6 py-4">
                <a
                  href="/resume.pdf"
                  download
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-surface"
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
