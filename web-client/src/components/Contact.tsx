import { Globe, GitBranch, Mail, Phone, Send } from 'lucide-react'
import type { ResumeContent } from '../content/types'
import { Reveal } from './Reveal'

interface ContactProps {
  content: ResumeContent
}

export function Contact({ content }: ContactProps) {
  const { links: contact } = content
  const links = [
    { icon: Mail, label: contact.email, href: `mailto:${contact.email}` },
    { icon: Send, label: contact.linkedinLabel, href: contact.linkedin },
    {
      icon: Phone,
      label: contact.phone,
      href: `tel:${contact.phone.replace(/[^+\d]/g, '')}`,
    },
    ...(contact.github ? [{ icon: GitBranch, label: contact.githubLabel, href: contact.github }] : []),
    ...(contact.website ? [{ icon: Globe, label: contact.websiteLabel, href: contact.website }] : []),
  ]

  return (
    <Reveal>
      <div className="rounded-3xl border border-line bg-surface-raised py-14 text-center">
        <p className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Let's build something great together.
        </p>
        <p className="mt-2 text-ink-dim">Reach out any time — I usually reply within a day.</p>
        <ul className="mt-9 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
                className="flex items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-medium text-nowrap text-ink transition-colors hover:border-accent-dim hover:text-accent-dim"
              >
                <link.icon size={15} className="shrink-0 text-accent-dim" />
                <span className="truncate">{link.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  )
}
