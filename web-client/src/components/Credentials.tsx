import type { EducationEntry } from '../content/types'

interface CredentialsProps {
  educationTitle: string
  certificationsTitle: string
  education: EducationEntry[]
  certifications: string[]
}

export function Credentials({ educationTitle, certificationsTitle, education, certifications }: CredentialsProps) {
  return (
    <div className="flex flex-col">
      {education.map((entry) => (
        <div key={entry.school} className="flex flex-wrap gap-x-12 gap-y-4 border-t border-(--ind-divider) py-7">
          <div className="flex flex-[1_1_200px] flex-col gap-2">
            <h3 className="text-[22px]">{educationTitle}</h3>
            <span className="text-sm opacity-70">{entry.period}</span>
          </div>
          <div className="flex flex-[3_1_480px] flex-col gap-1.5">
            <span className="ind-heading text-[28px] leading-[1.1]">{entry.school}</span>
            <span className="text-[15px] text-(--ind-accent-700)">{entry.degree}</span>
          </div>
        </div>
      ))}

      {certifications.length > 0 && (
        <div className="flex flex-wrap gap-x-12 gap-y-4 border-t border-(--ind-divider) py-7">
          <h3 className="flex-[1_1_200px] text-[22px]">{certificationsTitle}</h3>
          <ul className="m-0 flex flex-[3_1_480px] list-none flex-col gap-2 p-0 text-[15px]">
            {certifications.map((certification) => (
              <li key={certification}>{certification}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
