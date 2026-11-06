import { BLOG_ORIGIN } from '../../blog/url'
import type { ResumeContent } from '../../content/types'
import { resumeDownloadUrl } from '../../lib/resumeUrl'
import { ThemeToggle } from './ThemeToggle'

export function HomeHeader({ content }: { content: ResumeContent }) {
  const parts = content.meta.name.split(' ')
  const role = content.meta.headline.split(/[·\n]/)[0].trim()
  const links = [
    { href: '#about', label: 'About' },
    { href: '#experience', label: 'Experience' },
    ...(content.projects.length > 0 ? [{ href: '#projects', label: 'Projects' }] : []),
    { href: '#skills', label: 'Skills' },
    { href: '#contact', label: 'Contact' },
  ]

  return (
    <header className="sticky top-0 z-10 border-b border-(--ind-divider) bg-(--ind-bg)">
      <nav className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-5 gap-y-2 px-[clamp(20px,4vw,48px)] py-3.5 [&_a]:text-sm [&_a]:no-underline">
        <a
          href="#top"
          className="ind-heading mr-auto flex items-baseline gap-2.5 text-xl! text-(--ind-text)!"
          aria-label={`${content.meta.name}, back to top`}
        >
          {parts[0]} {parts.at(-1)}
          <span className="text-[13px] font-normal opacity-70 max-[560px]:hidden" style={{ fontFamily: 'var(--ind-body)' }}>
            {role}
          </span>
        </a>
        {links.map((link) => (
          <a key={link.href} href={link.href} className="text-(--ind-text)! hover:text-(--ind-accent-700)! max-[720px]:hidden">
            {link.label}
          </a>
        ))}
        <a href={BLOG_ORIGIN} className="text-(--ind-text)! hover:text-(--ind-accent-700)!">
          Blog
        </a>
        <ThemeToggle />
        <a href={resumeDownloadUrl} download className="btn btn-secondary min-h-[34px] px-3">
          Resume ↓
        </a>
      </nav>
    </header>
  )
}
