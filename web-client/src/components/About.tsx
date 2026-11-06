import type { ResumeContent } from '../content/types'
import { Corners } from './home/Corners'
import { HomeSection } from './home/HomeSection'

function earliestYear(content: ResumeContent): number | null {
  const years = content.experience
    .flatMap((entry) => entry.roles)
    .flatMap((role) => role.period.match(/\b(19|20)\d{2}\b/g) ?? [])
    .map(Number)
  return years.length ? Math.min(...years) : null
}

// The career numbers, all derived at render time from the Resume Profile
// (date parsing + array lengths), never hand-entered, so they can't drift
// out of sync with the content they summarize.
export function About({ content }: { content: ResumeContent }) {
  const since = earliestYear(content)
  const years = since ? new Date().getFullYear() - since : null
  const roleCount = content.experience.flatMap((entry) => entry.roles).length

  const stats = [
    years !== null ? { value: `${years}`, label: 'Years of experience' } : null,
    { value: String(content.experience.length), label: 'Companies' },
    { value: String(roleCount), label: 'Roles held' },
    { value: String(content.certifications.length), label: 'Certifications' },
  ].filter((stat): stat is { value: string; label: string } => stat !== null && stat.value !== '0')

  return (
    <HomeSection id="about" index="01 / About" title="By the numbers.">
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-6 p-0">
        {stats.map((stat) => (
          <li key={stat.label} className="card blueprint gap-1.5! p-6!">
            <Corners />
            <span className="ind-heading text-7xl leading-none">{stat.value}</span>
            <span className="text-sm opacity-70">{stat.label}</span>
          </li>
        ))}
      </ul>
    </HomeSection>
  )
}
