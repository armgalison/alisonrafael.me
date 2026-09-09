import { Mail, Phone, Send } from 'lucide-react'
import type { ResumeContent } from '../content/types'
import { Reveal } from './Reveal'

interface ContactProps {
  content: ResumeContent
}

export function Contact({ content }: ContactProps) {
  const links = [
    { icon: Mail, label: content.contact.email, href: `mailto:${content.contact.email}` },
    { icon: Send, label: content.contact.linkedinLabel, href: content.contact.linkedin },
    {
      icon: Phone,
      label: content.contact.phone,
      href: `tel:${content.contact.phone.replace(/[^+\d]/g, '')}`,
    },
  ]

  return (
    <Reveal>
      <div className="relative overflow-hidden rounded-3xl py-14 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(110,231,194,0.16),transparent_60%),radial-gradient(circle_at_15%_100%,rgba(167,139,250,0.1),transparent_50%)]"
        />
        <p className="font-mono text-sm text-accent">$ echo "let's talk"</p>
        <p className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Let's build something great together.
        </p>
        <p className="mt-2 text-ink-dim">Reach out any time — I usually reply within a day.</p>
        <ul className="mt-9 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
                className="flex items-center justify-center gap-2 rounded-full border border-line bg-surface-raised px-4 py-2.5 text-sm font-medium text-nowrap text-ink transition-colors hover:border-accent hover:text-accent"
              >
                <link.icon size={15} className="shrink-0 text-accent" />
                <span className="truncate">{link.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  )
}
