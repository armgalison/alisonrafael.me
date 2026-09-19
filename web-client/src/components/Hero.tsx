'use client'

import { motion } from 'framer-motion'
import { Download, MapPin } from 'lucide-react'
import type { ResumeContent } from '../content/types'
import { easeOut } from '../lib/motion'
import { resumeDownloadUrl } from '../lib/resumeUrl'

interface HeroProps {
  content: ResumeContent
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
}

export function   Hero({ content }: HeroProps) {
  return (
    <section id="top" className="relative overflow-hidden px-6 pt-24 pb-10">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto grid max-w-6xl items-end gap-12 lg:grid-cols-[1fr_360px]"
      >
        <div>
          <motion.p variants={item} className="mb-6 text-sm font-medium tracking-wide text-ink-dim uppercase">
            {content.hero.greeting}
          </motion.p>

          <motion.h1
            variants={item}
            className="text-4xl font-extrabold tracking-tight text-ink sm:text-6xl"
          >
            {content.meta.name}
          </motion.h1>
          <motion.p
            variants={item}
            className="mt-5 max-w-xl text-lg leading-relaxed whitespace-pre-line text-ink-dim"
          >
            {content.meta.headline}
          </motion.p>

          <motion.div variants={item} className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href={resumeDownloadUrl}
              download
              className="group inline-flex items-center gap-2 rounded-none bg-ink px-6 py-3 text-sm font-semibold text-surface transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              <Download size={16} className="transition-transform group-hover:-translate-y-0.5" />
              {content.hero.downloadResume}
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-none border border-ink/25 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-accent-dim hover:bg-accent/8 hover:text-accent-dim"
            >
              {content.hero.contactMe}
            </a>
          </motion.div>
        </div>

        <motion.div variants={item} className="hidden overflow-hidden lg:block">
          <img
            src="/avatar.png"
            alt={content.meta.name}
            className="aspect-[3/4] w-full object-cover grayscale"
          />
        </motion.div>
      </motion.div>
    </section>
  )
}
