import { HeroChatWrapper } from '../chat/HeroChatWrapper'
import type { ResumeContent } from '../content/types'
import { Corners } from './home/Corners'
import { ProgressiveAvatar } from './ProgressiveAvatar'

export function Hero({ content }: { content: ResumeContent }) {
  const parts = content.meta.name.split(' ')
  const [lead, ...restLines] = content.meta.headline
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  return (
    // On wide screens the hero fills the viewport below HomeHeader (63px tall) and the
    // portrait stretches to the full height of the row.
    <section className="grid grid-cols-1 gap-[clamp(32px,5vw,64px)] pt-[clamp(40px,7vw,88px)] pb-[clamp(48px,7vw,88px)] lg:min-h-[calc(100svh-63px)] lg:grid-cols-2 lg:py-10">
      <div className="@container flex min-w-0 flex-col justify-center gap-5">
        <p className="m-0 text-base text-(--ind-accent-700)">{content.hero.greeting}</p>
        {/* Sized to the column (cqi) so the full name always fits on one line. */}
        <h1 className="text-[min(104px,16cqi)] leading-[0.88] whitespace-nowrap">
          {parts[0]} {parts.at(-1)}
        </h1>
        <p className="m-0 max-w-[480px] text-lg leading-normal text-pretty">
          <span className="block">{lead}</span>
          {restLines.map((line) => (
            <span key={line} className="block opacity-70">
              {line}
            </span>
          ))}
        </p>
        <HeroChatWrapper />
      </div>

      <div className="blueprint aspect-[4/5] w-full max-w-[460px] lg:aspect-auto lg:h-full lg:max-w-[520px] lg:justify-self-end">
        <ProgressiveAvatar
          alt={`Portrait of ${content.meta.name}`}
          className="absolute inset-0 block h-full w-full object-cover grayscale"
        />
        <Corners />
      </div>
    </section>
  )
}
