import type { ProjectEntry } from '../content/types'

interface ProjectsProps {
  entries: ProjectEntry[]
}

// Same full-bleed row grid as Experience: period in the left column, name +
// the employer it was built at in the middle, description and skills right.
export function Projects({ entries }: ProjectsProps) {
  return (
    <ul className="-mx-(--gutter) border-t border-rule">
      {entries.map((project) => (
        <li key={`${project.name}-${project.period}`} className="border-b border-rule last:border-b-0">
          <div className="grid items-baseline gap-x-5 gap-y-3 px-(--gutter) py-[clamp(1.5rem,3.2vw,3.2rem)] min-[721px]:grid-cols-[minmax(9rem,0.4fr)_minmax(0,1.1fr)_minmax(16rem,1fr)]">
            <p className="mono-label text-ink-dim">{project.period}</p>
            <div>
              <h3 className="font-serif text-[clamp(1.75rem,3.5vw,4rem)] leading-[0.92] font-normal tracking-[-0.055em]">
                {project.name}
              </h3>
              <p className="mono-label mt-3 text-ink-dim">{project.association}</p>
            </div>
            <div className="max-w-[34rem] space-y-3 text-[0.95rem] leading-[1.45]">
              {project.description.split(/\n\s*\n/).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {project.skills.length > 0 && (
                <p className="mono-label pt-2 text-ink-dim">{project.skills.join(' / ')}</p>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
