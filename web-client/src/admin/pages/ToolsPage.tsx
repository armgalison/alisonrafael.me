'use client'

import { motion } from 'framer-motion'
import { FileEdit, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { easeOut } from '../../lib/motion'
import { useAdminContent } from '../i18n'

// Landing page for the Admin's personal tools, built as a grid so more
// tools slot in as cards without restructuring the nav.
export function ToolsPage() {
  const content = useAdminContent()

  const tools = [
    {
      href: '/admin/tools/cover-letter',
      icon: FileEdit,
      name: content.tools.coverLetterName,
      description: content.tools.coverLetterDescription,
    },
    {
      href: '/admin/tools/trends',
      icon: TrendingUp,
      name: content.tools.trendsName,
      description: content.tools.trendsDescription,
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-semibold">{content.tools.heading}</h1>
        <p className="mt-1 text-sm text-ink-dim">{content.tools.subtitle}</p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {tools.map((tool, index) => (
          <motion.li
            key={tool.href}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.03, ease: easeOut }}
          >
            <Link
              href={tool.href}
              className="flex h-full flex-col gap-3 rounded-2xl border border-line bg-surface-raised p-5 transition-colors hover:border-accent-dim"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <tool.icon size={18} />
              </span>
              <div>
                <p className="font-semibold">{tool.name}</p>
                <p className="mt-1 text-sm text-ink-dim">{tool.description}</p>
              </div>
            </Link>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}
