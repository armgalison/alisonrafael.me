import type { ReactNode } from 'react'

// Body copy size shared by the text-heavy blocks inside a Section.
export const copyClass = 'text-[clamp(1.05rem,1.65vw,1.42rem)] leading-[1.45]'

interface SectionProps {
  id?: string
  // e.g. "02 / Experience" — the small mono label in the left rail.
  index: string
  title: ReactNode
  // Lets a full-bleed list (rows that run edge to edge) sit flush against the
  // section's bottom rule instead of stopping short of it.
  flush?: boolean
  // A page whose only headline is this Section's (the Blog list) makes it
  // the page's h1.
  headingLevel?: 'h1' | 'h2'
  children: ReactNode
}

// Every page section: a full-width block closed by a 1px rule, with the
// index label in a narrow left rail and a large serif headline + content on
// the right (stacked on small screens).
export function Section({ id, index, title, flush = false, headingLevel = 'h2', children }: SectionProps) {
  const Heading = headingLevel

  return (
    <section
      id={id}
      className={`gap-[clamp(1.5rem,5vw,7rem)] border-b border-rule px-(--gutter) pt-[clamp(4rem,10vw,10rem)] min-[721px]:grid min-[721px]:grid-cols-[minmax(9rem,0.33fr)_minmax(0,1fr)] ${
        flush ? 'pb-0' : 'pb-[clamp(4rem,10vw,10rem)]'
      }`}
    >
      <p className="mono-label mb-14 text-ink-dim min-[721px]:mb-0">{index}</p>
      <div className="min-w-0">
        <Heading className="mb-[clamp(2.25rem,5vw,4.75rem)] max-w-[16ch] font-serif text-[clamp(2.3rem,5.1vw,5.7rem)] leading-[0.94] font-normal tracking-[-0.06em]">
          {title}
        </Heading>
        {children}
      </div>
    </section>
  )
}

// A labelled block inside a section body. Wrap a run of these in an element
// with `divide-y divide-line` to get the hairline between them.
export function Entry({ label, children }: { label: string; children: ReactNode }) {
  return (
    <article className="py-9 first:pt-0 last:pb-0">
      <span className="mono-label mb-3 block text-ink-dim">{label}</span>
      {children}
    </article>
  )
}
