import type { ReactNode } from 'react'

interface HomeSectionProps {
  id: string
  // e.g. "02 / Experience"
  index: string
  title: string
  children: ReactNode
}

export function HomeSection({ id, index, title, children }: HomeSectionProps) {
  return (
    <section id={id} className="flex scroll-mt-16 flex-col gap-8 border-t border-(--ind-divider) py-18">
      <div className="flex flex-col gap-2">
        <p className="m-0 text-xs tracking-[0.1em] text-(--ind-accent-700) uppercase">{index}</p>
        <h2 className="text-[clamp(36px,4.5vw,52px)] leading-none">{title}</h2>
      </div>
      {children}
    </section>
  )
}
