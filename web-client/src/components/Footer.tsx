import type { ResumeContent } from '../content/types'

interface FooterProps {
  content: ResumeContent
}

export function Footer({ content }: FooterProps) {
  return (
    <footer className="flex items-center justify-between gap-8 px-(--gutter) py-5">
      <div className="flex flex-col gap-1">
        <p className="mono-label text-ink-dim">
          © {new Date().getFullYear()} {content.meta.name} — {content.footer.rights}
        </p>
        <p className="mono-label text-ink-dim">{content.footer.accessLogNotice}</p>
      </div>
      <a
        href="#top"
        className="shrink-0 font-mono text-[0.66rem] font-semibold tracking-[0.07em] uppercase underline underline-offset-[0.16em]"
      >
        Back to top ↑
      </a>
    </footer>
  )
}
