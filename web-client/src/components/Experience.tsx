'use client'

import { Briefcase, MapPin } from 'lucide-react'
import type { ExperienceEntry } from '../content/types'
import { Reveal } from './Reveal'

interface ExperienceProps {
  entries: ExperienceEntry[]
}

function RoleCard({
  role,
  company,
  current = false,
}: {
  role: ExperienceEntry['roles'][number]
  company: string
  current?: boolean
}) {
  const dotColor = current ? 'bg-accent' : 'bg-line'
  const dotRing = current
    ? 'shadow-[0_0_0_4px_var(--color-accent-soft)]'
    : 'shadow-[0_0_0_4px_var(--color-surface)]'

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
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-accent-dim uppercase">
                Current
              </span>
            )}
          </h3>
          <span className="text-xs text-ink-dim">{role.period}</span>
        </div>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-dim">
          <Briefcase size={13} className="text-accent-dim" />
          {company}
          <span className="text-line">·</span>
          <MapPin size={13} className="text-accent-dim" />
          {role.location}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-dim">{role.description}</p>
      </div>
    </div>
  )
}

export function Experience({ entries }: ExperienceProps) {
  return (
    <div className="relative">
      <div className="absolute top-2 bottom-2 left-[7px] w-px bg-gradient-to-b from-line via-line to-transparent" />

      <div className="space-y-5">
        {entries.map((entry, entryIndex) => (
          <Reveal key={entry.company}>
            <div className="space-y-5">
              {entry.roles.map((role, roleIndex) => (
                <RoleCard
                  key={`${entry.company}-${role.title}-${role.period}`}
                  role={role}
                  company={entry.company}
                  current={entryIndex === 0 && roleIndex === 0}
                />
              ))}
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  )
}
