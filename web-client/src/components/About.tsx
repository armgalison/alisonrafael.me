import type { ResumeContent } from '../content/types'
import { Section } from './Section'

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
    years !== null ? { value: `${years}+`, label: 'Years of experience' } : null,
    { value: String(content.experience.length), label: 'Companies' },
    { value: String(roleCount), label: 'Roles held' },
    { value: String(content.certifications.length), label: 'Certifications' },
  ].filter((stat): stat is { value: string; label: string } => stat !== null && stat.value !== '0')

  return (
    <Section id="about" index="01 / About" title="By the numbers.">
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-x-[clamp(1.5rem,5vw,5.5rem)] gap-y-10">
        {stats.map((stat) => (
          <li key={stat.label} className="border-t border-rule pt-5">
            <p className="mb-3 font-serif text-[clamp(3rem,7vw,7rem)] leading-[0.9] tracking-[-0.06em]">
              {stat.value}
            </p>
            <p className="mono-label text-ink-dim">{stat.label}</p>
          </li>
        ))}
      </ul>
    </Section>
  )
}
