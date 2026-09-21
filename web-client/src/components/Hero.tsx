import type { ResumeContent } from '../content/types'

interface HeroProps {
  content: ResumeContent
}

// Two columns: an oversized name and a serif statement on the left, a
// full-bleed black-and-white portrait with a caption bar on the right.
export function Hero({ content }: HeroProps) {
  const [first, ...rest] = content.meta.name.split(' ')
  const last = rest.at(-1) ?? ''

  return (
    <section
      id="top"
      className="grid border-b border-rule min-[721px]:min-h-[min(48rem,calc(100svh-3.6rem))] min-[721px]:grid-cols-[minmax(0,1.12fr)_minmax(15rem,0.88fr)]"
    >
      <div className="flex flex-col items-start justify-between px-(--gutter) pt-[clamp(2rem,6vw,6rem)] pb-[clamp(2rem,4vw,4rem)] max-[720px]:min-h-[36rem]">
        <p className="mono-label">{content.hero.greeting}</p>

        <h1 className="mt-[clamp(3rem,10vw,8rem)] mb-[clamp(3rem,8vw,6.5rem)] max-w-[9ch] text-[clamp(4.5rem,11.1vw,11.5rem)] leading-[0.78] font-normal tracking-[-0.085em]">
          {first}
          <br />
          {last}
        </h1>

        <p className="max-w-xl font-serif text-[clamp(1.15rem,1.65vw,1.55rem)] leading-[1.25] whitespace-pre-line">
          {content.meta.headline}
        </p>
      </div>

      <figure className="relative m-0 flex flex-col overflow-hidden border-rule bg-[#e5e5e5] after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] after:bg-[length:100%_4px] after:mix-blend-soft-light after:content-[''] max-[720px]:min-h-[27rem] max-[720px]:border-t min-[721px]:border-l">
        <img
          src="/avatar.png"
          alt={`Portrait of ${content.meta.name}`}
          className="h-full min-h-[26rem] w-full object-cover mix-blend-multiply brightness-105 contrast-125 grayscale"
        />
        <figcaption className="mono-label absolute inset-x-0 bottom-0 z-10 flex justify-between gap-4 bg-black/85 px-4 py-[0.9rem] text-white">
          <span>{content.meta.name.split(' ')[0]} {last}</span>
        </figcaption>
      </figure>
    </section>
  )
}
