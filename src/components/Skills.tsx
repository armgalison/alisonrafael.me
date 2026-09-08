import {
  BrainCircuit,
  Braces,
  Code2,
  Languages as LanguagesIcon,
  Layers,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import type { LanguageSkill } from '../content/types'
import { Reveal } from './Reveal'

interface SkillsProps {
  topSkills: string[]
  technologyGroups: Array<{ label: string; items: string[] }>
  languages: LanguageSkill[]
}

const skillIcons: Record<string, typeof Sparkles> = {
  'AI-Native Development': BrainCircuit,
  'Functional Programming': Braces,
  'Full-Stack Engineering': Layers,
  'Site Reliability Engineering': ShieldCheck,
}

export function Skills({ topSkills, technologyGroups, languages }: SkillsProps) {
  return (
    <div className="space-y-8">
      <Reveal>
        <h3 className="mb-4 text-xs font-medium tracking-wide text-ink-dim uppercase">
          Top Skills
        </h3>
        <ul className="flex flex-wrap gap-2">
          {topSkills.map((skill) => {
            const Icon = skillIcons[skill] ?? Sparkles
            return (
              <li
                key={skill}
                className="flex items-center gap-2 rounded-full border border-accent/25 bg-accent/5 px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-accent/50"
              >
                <Icon size={13} className="shrink-0 text-accent" />
                {skill}
              </li>
            )
          })}
        </ul>
      </Reveal>

      <Reveal delay={0.05}>
        <h3 className="mb-4 flex items-center gap-2 text-xs font-medium tracking-wide text-ink-dim uppercase">
          <Code2 size={14} />
          Technologies
        </h3>
        <div className="space-y-3">
          {technologyGroups.map((group) => (
            <div key={group.label} className="flex flex-wrap items-center gap-2">
              <span className="w-full text-[11px] text-ink-dim/70 sm:w-auto sm:min-w-[110px]">
                {group.label}
              </span>
              {group.items.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-line bg-surface px-3 py-1 font-mono text-xs text-ink-dim"
                >
                  {tech}
                </span>
              ))}
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <h3 className="mb-4 flex items-center gap-2 text-xs font-medium tracking-wide text-ink-dim uppercase">
          <LanguagesIcon size={14} />
          Languages
        </h3>
        <ul className="space-y-2">
          {languages.map((language) => (
            <li
              key={language.name}
              className="flex items-center justify-between rounded-lg border border-line bg-surface px-3 py-2 text-sm"
            >
              <span className="text-ink">{language.name}</span>
              <span className="rounded-full bg-surface-raised px-2.5 py-0.5 text-xs text-ink-dim">
                {language.level}
              </span>
            </li>
          ))}
        </ul>
      </Reveal>
    </div>
  )
}
