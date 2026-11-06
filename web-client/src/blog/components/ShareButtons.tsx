'use client'

import { Link } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { blogPostUrl } from '../url'

// lucide-react 1.x dropped its brand icons; these are Lucide's own LinkedIn and
// Facebook outlines (ISC), drawn like every other icon here (16px, stroke 1.5).
function LinkedinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

const buttonClass = 'btn btn-secondary icon-btn text-(--ind-text)! no-underline'

export function ShareButtons({ slug, title }: { slug: string; title: string }) {
  const url = blogPostUrl(slug)
  const [copied, setCopied] = useState(false)
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (copyTimeout.current) clearTimeout(copyTimeout.current)
  }, [])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      if (copyTimeout.current) clearTimeout(copyTimeout.current)
      copyTimeout.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can reject in an insecure context — leave the button as-is.
    }
  }

  const encoded = encodeURIComponent(url)
  const links = [
    { name: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`, icon: <LinkedinIcon /> },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`, icon: <FacebookIcon /> },
    {
      name: 'X',
      href: `https://x.com/intent/tweet?url=${encoded}&text=${encodeURIComponent(title)}`,
      icon: <span className="ind-heading text-[15px]">X</span>,
    },
  ]

  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-[13px] opacity-65">Share this post</span>
      <div className="flex gap-2">
        {links.map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Share on ${link.name}`}
            title={`Share on ${link.name}`}
            className={buttonClass}
          >
            {link.icon}
          </a>
        ))}
        <button type="button" onClick={handleCopy} aria-label="Copy link" title="Copy link" className={buttonClass}>
          <Link size={16} strokeWidth={1.5} aria-hidden />
        </button>
      </div>
      <span className="min-h-[18px] text-xs text-(--ind-accent-700)" aria-live="polite">
        {copied ? 'Link copied' : ''}
      </span>
    </div>
  )
}
