import type { ResumeContent } from '../content/types'
import { Corners } from './home/Corners'

export function Contact({ content }: { content: ResumeContent }) {
  const { links: contact } = content
  const entries = [
    { label: 'LinkedIn', text: contact.linkedinLabel, href: contact.linkedin },
    { label: 'Phone', text: contact.phone, href: `tel:${contact.phone.replace(/[^+\d]/g, '')}` },
    ...(contact.github ? [{ label: 'GitHub', text: contact.githubLabel, href: contact.github }] : []),
    ...(contact.website ? [{ label: 'Website', text: contact.websiteLabel, href: contact.website }] : []),
  ]

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-6">
      {entries.map((entry) => {
        const external = entry.href.startsWith('http')
        return (
          <a
            key={entry.href}
            href={entry.href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noreferrer' : undefined}
            className="card blueprint gap-2! p-5! text-(--ind-text)! no-underline hover:bg-(--ind-accent-100)"
          >
            <Corners />
            <span className="text-xs tracking-[0.1em] text-(--ind-accent-700) uppercase">{entry.label}</span>
            <span className="text-base break-words">{entry.text}</span>
          </a>
        )
      })}
    </div>
  )
}
