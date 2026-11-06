import type { ResumeContent } from '../../content/types'

export function HomeFooter({ content }: { content: ResumeContent }) {
  return (
    <footer className="border-t border-(--ind-divider)">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-8 gap-y-3 px-[clamp(20px,4vw,48px)] py-6 text-[13px]">
        <div className="flex flex-col gap-1 opacity-75">
          <span>
            © {new Date().getFullYear()} {content.meta.name} — {content.footer.rights}
          </span>
          <span>{content.footer.accessLogNotice}</span>
        </div>
        <a href="#top" className="no-underline">
          Back to top ↑
        </a>
      </div>
    </footer>
  )
}
