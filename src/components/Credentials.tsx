import { Award, GraduationCap } from 'lucide-react'
import type { EducationEntry } from '../content/types'
import { Reveal } from './Reveal'

interface CredentialsProps {
  educationTitle: string
  certificationsTitle: string
  education: EducationEntry[]
  certifications: string[]
}

export function Credentials({
  educationTitle,
  certificationsTitle,
  education,
  certifications,
}: CredentialsProps) {
  return (
    <Reveal>
      <div className="divide-y divide-line rounded-2xl border border-line bg-surface-raised">
        <div className="p-5">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-medium tracking-wide text-ink-dim uppercase">
            <GraduationCap size={14} className="text-violet" />
            {educationTitle}
          </h3>
          <ul className="space-y-3">
            {education.map((entry) => (
              <li key={entry.school}>
                <p className="text-sm font-medium text-ink">{entry.school}</p>
                <p className="mt-0.5 text-sm text-ink-dim">{entry.degree}</p>
                <p className="mt-0.5 font-mono text-xs text-ink-dim">{entry.period}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-5">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-medium tracking-wide text-ink-dim uppercase">
            <Award size={14} />
            {certificationsTitle}
          </h3>
          <ul className="space-y-2.5">
            {certifications.map((certification) => (
              <li key={certification} className="flex items-start gap-2.5 text-sm text-ink">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                {certification}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Reveal>
  )
}
