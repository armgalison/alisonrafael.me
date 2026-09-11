'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Briefcase, ChevronRight, MapPin } from 'lucide-react'
import { useState } from 'react'
import type { ExperienceEntry } from '../content/types'
import { easeOut } from '../lib/motion'
import { Reveal } from './Reveal'

interface ExperienceProps {
  entries: ExperienceEntry[]
}

function RoleCard({
  role,
  company,
  current = false,
  recent = false,
}: {
  role: ExperienceEntry['roles'][number]
  company: string
  current?: boolean
  recent?: boolean
}) {
  const dotColor = current || !recent ? 'bg-accent' : 'bg-violet'
  const dotRing = current
    ? 'shadow-[0_0_0_4px_var(--color-accent-soft),0_0_0_7px_rgba(110,231,194,0.15)]'
    : recent
      ? 'shadow-[0_0_0_4px_rgba(167,139,250,0.18)]'
      : 'shadow-[0_0_0_4px_var(--color-accent-soft)]'

  return (
    <div className="relative pl-10">
      {current && (
        <span className="absolute top-6 left-[7px] h-3 w-3 -translate-x-1/2 animate-ping rounded-full bg-accent/60" />
      )}
      <span
        className={`absolute top-6 left-[7px] h-3 w-3 -translate-x-1/2 rounded-full border-2 border-surface ${dotColor} ${dotRing}`}
      />
      <div
        className={`rounded-2xl border p-6 transition-colors ${
          current
            ? 'border-accent/40 bg-gradient-to-br from-accent/[0.06] to-surface-raised shadow-lg shadow-accent/5'
            : 'border-line bg-surface-raised shadow-lg shadow-black/20 hover:border-accent/40 hover:bg-surface-raised-hover'
        }`}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="flex items-center gap-2 font-semibold text-ink">
            {role.title}
            {current && (
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-accent uppercase">
                Current
              </span>
            )}
          </h3>
          <span className="font-mono text-xs text-ink-dim">{role.period}</span>
        </div>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-dim">
          <Briefcase size={13} className="text-accent" />
          {company}
          <span className="text-line">·</span>
          <MapPin size={13} className="text-accent" />
          {role.location}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-dim">{role.description}</p>
      </div>
    </div>
  )
}

function EarlierRoleRow({ role, company }: { role: ExperienceEntry['roles'][number]; company: string }) {
  return (
    <div className="relative pl-10">
      <span className="absolute top-2 left-[7px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-line" />
      <div className="border-l border-line/60 py-1 pl-4 text-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h4 className="font-medium text-ink-dim">{role.title}</h4>
          <span className="font-mono text-xs text-ink-dim/70">{role.period}</span>
        </div>
        <p className="mt-0.5 text-xs text-ink-dim/70">
          {company} · {role.location}
        </p>
        <p className="mt-1.5 leading-relaxed text-ink-dim/80">{role.description}</p>
      </div>
    </div>
  )
}

function GroupedRoleRow({ role }: { role: ExperienceEntry['roles'][number] }) {
  return (
    <div className="border-l-2 border-line/50 py-1 pl-4 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="font-medium text-ink-dim">{role.title}</h4>
        <span className="font-mono text-xs text-ink-dim/70">{role.period}</span>
      </div>
      <p className="mt-0.5 text-xs text-ink-dim/70">{role.location}</p>
      <p className="mt-1.5 leading-relaxed text-ink-dim/80">{role.description}</p>
    </div>
  )
}

function CompanyGroup({ company, duration, roles }: { company: string; duration: string; roles: ExperienceEntry['roles'] }) {
  return (
    <div className="relative pl-10">
      <span className="absolute top-3.5 left-[7px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-line" />
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-lg border border-line/60 bg-surface-raised/50 px-4 py-2.5">
        <span className="text-xs font-semibold tracking-wide text-ink-dim uppercase">{company}</span>
        <span className="font-mono text-xs text-ink-dim">{duration}</span>
      </div>
      <div className="mt-3 ml-6 space-y-3">
        {roles.map((role) => (
          <GroupedRoleRow key={`${company}-${role.title}-${role.period}`} role={role} />
        ))}
      </div>
    </div>
  )
}

export function Experience({ entries }: ExperienceProps) {
  const [showEarlier, setShowEarlier] = useState(false)

  const emphasized = entries.filter((entry) => entry.emphasized)
  const earlier = entries.filter((entry) => !entry.emphasized)

  return (
    <div className="relative">
      <div className="absolute top-2 bottom-2 left-[7px] w-px bg-gradient-to-b from-line via-line to-transparent" />

      <div className="space-y-5">
        {emphasized.map((entry, entryIndex) => (
          <Reveal key={entry.company}>
            <div className="space-y-5">
              {entry.roles.map((role, roleIndex) => (
                <RoleCard
                  key={`${entry.company}-${role.title}-${role.period}`}
                  role={role}
                  company={entry.company}
                  current={entryIndex === 0 && roleIndex === 0}
                  recent={entryIndex === 1}
                />
              ))}
            </div>
          </Reveal>
        ))}
      </div>

      {earlier.length > 0 && (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => setShowEarlier((value) => !value)}
            className="flex items-center gap-2 pl-10 text-sm font-medium text-ink-dim transition-colors hover:text-accent"
            aria-expanded={showEarlier}
          >
            <motion.span
              animate={{ rotate: showEarlier ? 90 : 0 }}
              className="inline-flex"
              transition={{ duration: 0.2 }}
            >
              <ChevronRight size={16} />
            </motion.span>
            {showEarlier ? 'Hide earlier roles' : `Show earlier roles (${earlier.length})`}
          </button>

          <AnimatePresence initial={false}>
            {showEarlier && (
              <motion.div
                key="earlier-roles"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: easeOut }}
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-4">
                  {earlier.map((entry) =>
                    entry.totalDuration ? (
                      <CompanyGroup
                        key={entry.company}
                        company={entry.company}
                        duration={entry.totalDuration}
                        roles={entry.roles}
                      />
                    ) : (
                      <div key={entry.company} className="space-y-3">
                        {entry.roles.map((role) => (
                          <EarlierRoleRow
                            key={`${entry.company}-${role.title}-${role.period}`}
                            role={role}
                            company={entry.company}
                          />
                        ))}
                      </div>
                    ),
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
