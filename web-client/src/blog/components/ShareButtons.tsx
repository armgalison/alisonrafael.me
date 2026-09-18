'use client'

import { Check, Link2, Share2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

// The Post's canonical origin — the site answers on both the apex and
// www with no redirect, so share links pin to one host regardless of
// which the reader is on (and it lines up with index.html's canonical).
const SITE_ORIGIN = 'https://alisonrafael.me'

// Brand marks from Simple Icons (CC0), inlined rather than pulling an
// icon package — lucide-react ships no brand glyphs.
const BRAND_PATHS = {
  linkedin:
    'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  facebook:
    'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.628-5.373-12-12-12s-12 5.372-12 12c0 5.628 3.874 10.35 9.101 11.647Z',
  x: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z',
} as const

function BrandIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

const controlClass =
  'flex h-9 w-9 items-center justify-center rounded-md border border-line text-ink-dim transition-colors hover:border-accent-dim hover:text-ink'

interface ShareButtonsProps {
  slug: string
  title: string
}

export function ShareButtons({ slug, title }: ShareButtonsProps) {
  const url = `${SITE_ORIGIN}/blog/${slug}`
  const [copied, setCopied] = useState(false)
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Resolve once, on mount, so it doesn't flash in or out.
  const [canNativeShare] = useState(
    () => typeof navigator !== 'undefined' && typeof navigator.share === 'function',
  )

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

  function handleNativeShare() {
    void navigator.share({ title, url }).catch(() => {})
  }

  const links = [
    {
      name: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      path: BRAND_PATHS.linkedin,
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      path: BRAND_PATHS.facebook,
    },
    {
      name: 'X',
      href: `https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      path: BRAND_PATHS.x,
    },
  ]

  return (
    <div className="mt-12">
      <p className="mb-3 text-sm font-semibold text-ink">Share this post</p>
      <div className="flex flex-wrap items-center gap-2">
        {links.map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Share on ${link.name}`}
            title={`Share on ${link.name}`}
            className={controlClass}
          >
            <BrandIcon path={link.path} />
          </a>
        ))}

        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? 'Copied!' : 'Copy link'}
          title={copied ? 'Copied!' : 'Copy link'}
          className={controlClass}
        >
          {copied ? <Check size={15} className="text-accent" /> : <Link2 size={15} />}
        </button>

        {canNativeShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            aria-label="Share…"
            title="Share…"
            className={controlClass}
          >
            <Share2 size={15} />
          </button>
        )}
      </div>
    </div>
  )
}
