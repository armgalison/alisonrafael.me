import type { ResumeContent } from '../content/types'
import { copyClass, Entry } from './Section'

interface ContactProps {
  content: ResumeContent
}

const linkClass =
  'break-words underline decoration-1 underline-offset-[0.16em] hover:decoration-2'

// Left: the secondary links as labelled entries. Right: the primary call to
// action in a single outlined panel.
export function Contact({ content }: ContactProps) {
  const { links: contact } = content
  const entries = [
    { label: 'LinkedIn', text: contact.linkedinLabel, href: contact.linkedin },
    { label: 'Phone', text: contact.phone, href: `tel:${contact.phone.replace(/[^+\d]/g, '')}` },
    ...(contact.github ? [{ label: 'GitHub', text: contact.githubLabel, href: contact.github }] : []),
    ...(contact.website ? [{ label: 'Website', text: contact.websiteLabel, href: contact.website }] : []),
  ]

  return (
    <div className="grid items-start gap-[clamp(3rem,10vw,11rem)] min-[721px]:grid-cols-[minmax(0,0.95fr)_minmax(16rem,0.75fr)]">
      <div className="divide-y divide-line">
        {entries.map((entry) => (
          <Entry key={entry.href} label={entry.label}>
            <a
              href={entry.href}
              target={entry.href.startsWith('http') ? '_blank' : undefined}
              rel={entry.href.startsWith('http') ? 'noreferrer' : undefined}
              className={`${copyClass} ${linkClass}`}
            >
              {entry.text}
            </a>
          </Entry>
        ))}
      </div>
    </div>
  )
}
