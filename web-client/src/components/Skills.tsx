import type { LanguageSkill } from '../content/types'
import { Entry } from './Section'

interface SkillsProps {
  topSkills: string[]
  technologyGroups: Array<{ label: string; items: string[] }>
  languages: LanguageSkill[]
  languagesTitle: string
}

export function Skills({ topSkills, technologyGroups, languages, languagesTitle }: SkillsProps) {
  return (
    <div className="grid gap-[clamp(3rem,10vw,11rem)] min-[721px]:grid-cols-[minmax(0,0.95fr)_minmax(16rem,0.75fr)]">
      <div>
        <h3 className="mono-label mb-4 text-ink-dim">Top skills</h3>
        <ol className="border-t border-line">
          {topSkills.map((skill, index) => (
            <li key={skill} className="flex items-baseline gap-4 border-b border-line py-5">
              <span className="mono-label w-8 shrink-0 text-ink-dim">{String(index + 1).padStart(2, '0')}</span>
              <span className="font-serif text-[clamp(1.4rem,2.5vw,2.2rem)] leading-[1.03] tracking-[-0.045em]">
                {skill}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="divide-y divide-line">
        {technologyGroups.map((group) => (
          <Entry key={group.label} label={group.label}>
            <p className="text-[1.05rem] leading-[1.45]">{group.items.join(', ')}</p>
          </Entry>
        ))}
        <Entry label={languagesTitle}>
          <ul className="space-y-1 text-[1.05rem] leading-[1.45]">
            {languages.map((language) => (
              <li key={language.name}>
                {language.name} <span className="text-ink-dim">— {language.level}</span>
              </li>
            ))}
          </ul>
        </Entry>
      </div>
    </div>
  )
}
