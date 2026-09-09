import { motion } from 'framer-motion'
import { Download, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ResumeContent } from '../content/types'
import { easeOut } from '../lib/motion'

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

function useTypewriter(text: string, speed = 32) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (count >= text.length) return
    const id = setTimeout(() => setCount((value) => value + 1), speed)
    return () => clearTimeout(id)
  }, [count, text, speed])

  return { typed: text.slice(0, count), done: count >= text.length }
}

function TerminalCard({ content }: { content: ResumeContent }) {
  const { typed, done } = useTypewriter(content.hero.terminalIntro)
  const [hashes] = useState(() =>
    content.hero.terminalCommits.map(() => Math.random().toString(16).slice(2, 9)),
  )

  return (
    <motion.div
      variants={item}
      className="hidden overflow-hidden rounded-2xl border border-line bg-surface-raised/60 shadow-2xl shadow-black/40 backdrop-blur-sm lg:block"
    >
      <div className="flex items-center gap-1.5 border-b border-line px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-ink-dim/30" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink-dim/30" />
        <span className="h-2.5 w-2.5 rounded-full bg-accent/60" />
        <span className="ml-2 font-mono text-xs text-ink-dim">alison@portfolio ~ </span>
      </div>
      <div className="space-y-3 p-5 font-mono text-xs leading-relaxed">
        <p>
          <span className="text-accent">❯</span> <span className="text-ink">{typed}</span>
          {!done && <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-accent" />}
        </p>

        {done &&
          content.hero.terminalCommits.map((commit, i) => (
            <motion.p
              key={commit}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.15, ease: easeOut }}
              className="pl-1 text-ink-dim"
            >
              <span className="text-violet">{hashes[i]}</span> {commit}
            </motion.p>
          ))}

        {done && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: content.hero.terminalCommits.length * 0.15 + 0.2 }}
            className="flex items-center gap-2 pt-1"
          >
            <span className="text-accent">❯</span>
            <span className="h-3.5 w-1.5 animate-pulse bg-accent" />
          </motion.p>
        )}
      </div>
    </motion.div>
  )
}

export function Hero({ content }: HeroProps) {
  return (
    <section id="top" className="relative overflow-hidden px-6 pt-24 pb-10">
      <div aria-hidden className="bg-grid absolute inset-0 -z-20 opacity-60" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_-10%,rgba(110,231,194,0.18),transparent_55%),radial-gradient(circle_at_85%_10%,rgba(167,139,250,0.12),transparent_50%)]"
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto grid max-w-6xl items-end gap-12 lg:grid-cols-[1fr_360px]"
      >
        <div>
          <motion.div variants={item} className="mb-8 flex items-center gap-4">
            <img
              src="/avatar.png"
              alt={content.meta.name}
              className="bg-white h-16 w-16 shrink-0 rounded-2xl object-cover shadow-[0_0_30px_-8px_rgba(110,231,194,0.6)]"
            />
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              Open to new opportunities
            </span>
          </motion.div>

          <motion.p variants={item} className="mb-3 font-mono text-sm text-accent">
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
          <motion.p variants={item} className="mt-3 flex items-center gap-1.5 text-sm text-ink-dim">
            <MapPin size={14} className="text-accent" />
            {content.meta.location}
          </motion.p>

          <motion.div variants={item} className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href="/resume.pdf"
              download
              className="group inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-surface transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              <Download size={16} className="transition-transform group-hover:-translate-y-0.5" />
              {content.hero.downloadResume}
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-full border border-ink-dim/40 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-accent hover:bg-accent/10 hover:text-accent"
            >
              {content.hero.contactMe}
            </a>
          </motion.div>
        </div>

        <TerminalCard content={content} />
      </motion.div>
    </section>
  )
}
