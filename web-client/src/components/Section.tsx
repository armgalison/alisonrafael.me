import type { LucideIcon } from 'lucide-react'
import { Reveal } from './Reveal'

interface SectionHeadingProps {
  title: string
  icon: LucideIcon
}

export function SectionHeading({ title, icon: Icon }: SectionHeadingProps) {
  return (
    <Reveal>
      <h2 className="mb-8 flex items-center gap-3 text-sm font-semibold tracking-widest text-accent uppercase">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <Icon size={16} />
        </span>
        {title}
      </h2>
    </Reveal>
  )
}
