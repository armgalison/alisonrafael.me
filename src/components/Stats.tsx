import type { ResumeContent } from '../content/types'
import { Reveal } from './Reveal'

interface StatsProps {
  content: ResumeContent
}

function earliestYear(content: ResumeContent): number | null {
  const years = content.experience
    .flatMap((entry) => entry.roles)
    .flatMap((role) => role.period.match(/\b(19|20)\d{2}\b/g) ?? [])
    .map(Number)
  return years.length ? Math.min(...years) : null
}

export function Stats({ content }: StatsProps) {
  const since = earliestYear(content)
  const years = since ? new Date().getFullYear() - since : null
  const roleCount = content.experience.flatMap((entry) => entry.roles).length

  const stats = [
    years !== null ? { value: `${years}+`, label: 'Years of experience' } : null,
    { value: String(content.experience.length), label: 'Companies' },
    { value: String(roleCount), label: 'Roles held' },
    { value: String(content.certifications.length), label: 'Certifications' },
  ].filter((stat): stat is { value: string; label: string } => stat !== null)

  return (
    <div className="mx-auto max-w-6xl px-6 pb-4">
      <Reveal>
        <div className="grid grid-cols-2 divide-x divide-y divide-line rounded-2xl border border-line sm:grid-cols-4 sm:divide-y-0">
          {stats.map((stat) => (
            <div key={stat.label} className="px-4 py-5 text-center">
              <p className="font-mono text-2xl font-bold text-accent sm:text-3xl">{stat.value}</p>
              <p className="mt-1 text-xs text-ink-dim">{stat.label}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  )
}
