import type { ResumeContent } from '../content/types'

interface FooterProps {
  content: ResumeContent
}

export function Footer({ content }: FooterProps) {
  return (
    <footer className="border-t border-line/60 px-6 py-8 text-center text-xs text-ink-dim">
      © {new Date().getFullYear()} {content.meta.name} — {content.footer.rights}
    </footer>
  )
}
