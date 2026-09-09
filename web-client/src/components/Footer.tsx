import type { ResumeContent } from '../content/types'

interface FooterProps {
  content: ResumeContent
}

export function Footer({ content }: FooterProps) {
  return (
    <footer className="border-t border-line/60 px-6 py-8 text-center font-mono text-xs text-ink-dim">
      <span className="text-accent">$</span> © {new Date().getFullYear()} {content.meta.name} —{' '}
      {content.footer.rights}
    </footer>
  )
}
