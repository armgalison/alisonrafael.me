import type { EducationEntry } from '../content/types'
import { copyClass } from './Section'

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
    <div
      className={`grid gap-[clamp(3rem,10vw,11rem)] ${
        certifications.length > 0 ? 'min-[721px]:grid-cols-2' : ''
      }`}
    >
      <div>
        <h3 className="mono-label mb-4 text-ink-dim">{educationTitle}</h3>
        <ul className="border-t border-line">
          {education.map((entry) => (
            <li key={entry.school} className="border-b border-line py-6">
              <p className="mono-label mb-3 text-ink-dim">{entry.period}</p>
              <p className="font-serif text-[clamp(1.4rem,2.5vw,2.2rem)] leading-[1.03] tracking-[-0.045em]">
                {entry.school}
              </p>
              <p className={`${copyClass} mt-2 text-ink-dim`}>{entry.degree}</p>
            </li>
          ))}
        </ul>
      </div>

      {certifications.length > 0 && (
        <div>
          <h3 className="mono-label mb-4 text-ink-dim">{certificationsTitle}</h3>
          <ul className="border-t border-line">
            {certifications.map((certification) => (
              <li key={certification} className="border-b border-line py-6 text-[1.05rem] leading-[1.45]">
                {certification}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
