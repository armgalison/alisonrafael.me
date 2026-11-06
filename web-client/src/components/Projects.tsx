import type { ProjectEntry } from '../content/types'
import { Corners } from './home/Corners'

export function Projects({ entries }: { entries: ProjectEntry[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] items-stretch gap-6">
      {entries.map((project) => (
        <article key={`${project.name}-${project.period}`} className="card blueprint gap-3! p-6!">
          <Corners />
          <p className="card-kicker m-0">
            {project.period}
            {project.association && ` · ${project.association}`}
          </p>
          <h3 className="text-[28px] leading-[1.1]">{project.name}</h3>
          <div className="flex flex-1 flex-col gap-2.5 text-sm leading-[1.6] opacity-85">
            {project.description.split(/\n\s*\n/).map((paragraph) => (
              <p key={paragraph} className="m-0">
                {paragraph}
              </p>
            ))}
          </div>
          {project.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {project.skills.map((skill) => (
                <span key={skill} className="tag tag-outline">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </article>
      ))}
    </div>
  )
}
