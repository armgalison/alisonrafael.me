import type { ExperienceEntry } from '../content/types'

interface ExperienceProps {
  entries: ExperienceEntry[]
}

// A full-bleed list of rows separated by full-strength rules — one row per
// role, newest first. The first role overall is the current one.
export function Experience({ entries }: ExperienceProps) {
  const roles = entries.flatMap((entry) => entry.roles.map((role) => ({ role, company: entry.company })))

  return (
    <ul className="-mx-(--gutter) border-t border-rule">
      {roles.map(({ role, company }, index) => (
        <li key={`${company}-${role.title}-${role.period}`} className="border-b border-rule last:border-b-0">
          <div className="grid items-baseline gap-x-5 gap-y-3 px-(--gutter) py-[clamp(1.5rem,3.2vw,3.2rem)] min-[721px]:grid-cols-[minmax(9rem,0.4fr)_minmax(0,1.1fr)_minmax(16rem,1fr)]">
            <p className="mono-label text-ink-dim">
              {role.period}
              {index === 0 && <span className="mt-1 block text-ink">Current role</span>}
            </p>
            <div>
              <h3 className="font-serif text-[clamp(1.75rem,3.5vw,4rem)] leading-[0.92] font-normal tracking-[-0.055em]">
                {role.title}
              </h3>
              <p className="mono-label mt-3 text-ink-dim">
                {company} / {role.location}
              </p>
            </div>
            <p className="max-w-[34rem] text-[0.95rem] leading-[1.45]">{role.description}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
