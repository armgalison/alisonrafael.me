import type { ExperienceEntry } from '../content/types'

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']

function monthIndex(text: string): number | null {
  if (/present/i.test(text)) {
    const now = new Date()
    return now.getFullYear() * 12 + now.getMonth()
  }
  const match = text.trim().match(/^([a-z]+)\s+(\d{4})$/i)
  if (!match) return null
  const month = MONTHS.indexOf(match[1].toLowerCase())
  return month === -1 ? null : Number(match[2]) * 12 + month
}

// "September 2021 - Present" -> "5 years 3 months", counting both end months like LinkedIn does.
function roleDuration(period: string): string | null {
  const [from, to] = period.split(/\s+[-–]\s+/)
  if (!from || !to) return null
  const start = monthIndex(from)
  const end = monthIndex(to)
  if (start === null || end === null || end < start) return null
  const total = end - start + 1
  const years = Math.floor(total / 12)
  const months = total % 12
  return [
    years ? `${years} ${years === 1 ? 'year' : 'years'}` : '',
    months ? `${months} ${months === 1 ? 'month' : 'months'}` : '',
  ]
    .filter(Boolean)
    .join(' ')
}

// "September 2021 - Present (5 years)" -> period without the parenthetical, plus the duration
// (the profile's own when it states one, otherwise computed).
function splitPeriod(period: string): { dates: string; duration: string | null } {
  const stated = period.match(/\(([^)]+)\)/)?.[1]?.trim() ?? null
  const dates = period.replace(/\s*\([^)]*\)\s*/g, ' ').trim()
  return { dates, duration: stated ?? roleDuration(dates) }
}

// One row per role, newest first. The first role overall is the current one.
export function Experience({ entries }: { entries: ExperienceEntry[] }) {
  const roles = entries.flatMap((entry) => entry.roles.map((role) => ({ role, company: entry.company })))

  return (
    <div className="flex flex-col">
      {roles.map(({ role, company }, index) => {
        const { dates, duration } = splitPeriod(role.period)
        return (
          <article
            key={`${company}-${role.title}-${role.period}`}
            className="flex flex-wrap gap-x-12 gap-y-4 border-t border-(--ind-divider) py-7"
          >
            <div className="flex flex-[1_1_200px] flex-col items-start gap-2">
              <span className="text-sm">{dates}</span>
              {duration && <span className="text-[13px] opacity-70">{duration}</span>}
              {index === 0 && <span className="tag tag-accent">Current role</span>}
            </div>
            <div className="flex min-w-0 flex-[3_1_480px] flex-col gap-2">
              <h3 className="text-[28px] leading-[1.1]">{role.title}</h3>
              <p className="m-0 text-sm text-(--ind-accent-700)">
                {company} / {role.location}
              </p>
              <p className="mt-1.5 mb-0 max-w-[72ch] text-base leading-[1.6] text-pretty opacity-85">{role.description}</p>
            </div>
          </article>
        )
      })}
    </div>
  )
}
