import type { LanguageSkill } from '../content/types'
import { Corners } from './home/Corners'

interface SkillsProps {
  topSkills: string[]
  technologyGroups: Array<{ label: string; items: string[] }>
  languages: LanguageSkill[]
  languagesTitle: string
}

export function Skills({ topSkills, technologyGroups, languages, languagesTitle }: SkillsProps) {
  return (
    <>
      <div className="flex flex-col gap-3.5">
        <h3 className="text-[22px]">Top skills</h3>
        <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-6 p-0">
          {topSkills.map((skill, index) => (
            <li key={skill} className="blueprint flex flex-col gap-2.5 p-5">
              <Corners />
              <span className="ind-heading text-sm font-normal! text-(--ind-accent-700)">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="ind-heading text-2xl leading-[1.1]">{skill}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-wrap gap-x-12 gap-y-8 pt-2">
        <dl className="m-0 flex flex-[3_1_480px] flex-col">
          {technologyGroups.map((group) => (
            <div
              key={group.label}
              className="flex flex-wrap gap-x-6 gap-y-1 border-t border-(--ind-divider) py-3.5 last:border-b"
            >
              <dt className="flex-[0_0_160px] text-sm text-(--ind-accent-700)">{group.label}</dt>
              <dd className="m-0 flex-[1_1_240px] text-[15px]">{group.items.join(', ')}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-[1_1_240px] flex-col gap-3">
          <h3 className="text-[22px]">{languagesTitle}</h3>
          <ul className="m-0 flex list-none flex-col p-0">
            {languages.map((language) => (
              <li
                key={language.name}
                className="flex flex-col gap-0.5 border-t border-(--ind-divider) py-3 last:border-b"
              >
                <span className="text-[15px]">{language.name}</span>
                <span className="text-[13px] opacity-65">{language.level}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}
