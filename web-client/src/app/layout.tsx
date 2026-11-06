import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { AVATAR_URL, SITE_ORIGIN, SITE_SHORT_NAME, SITE_TITLE } from '../seo/site'
import { ChatContainer } from '../chat/ChatContainer'
import './globals.css'

const SITE_DESCRIPTION =
  'Alison Rafael Marinho Gonçalves (Alison Rafael) — Full Stack Software Engineer. Resume, experience, skills, and blog.'

// Site-wide fallback link-preview tags — apply to every route that doesn't
// set its own metadata (the resume, the /blog list, a 404). A Post's
// reading page (/blog/[slug]) overrides these with real per-post values via
// its own generateMetadata — see docs/adr/0013-migrate-web-client-to-nextjs-app-router.md
// (which replaced the old ADR 0011/0012 approach of injecting these same
// tags into an otherwise still-client-rendered SPA shell).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: { default: SITE_TITLE, template: `%s — ${SITE_SHORT_NAME}` },
  description: SITE_DESCRIPTION,
  authors: [{ name: 'Alison Rafael Marinho Gonçalves', url: SITE_ORIGIN }],
  alternates: { canonical: '/' },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    url: SITE_ORIGIN,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: SITE_TITLE,
    images: [{ url: AVATAR_URL, alt: 'Portrait of Alison Rafael Marinho Gonçalves' }],
  },
  twitter: {
    card: 'summary',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [AVATAR_URL],
  },
}

// Runs before first paint so the stored theme (default dark) never flashes. The key
// "ag-theme" must match THEME_STORAGE_KEY in components/home/ThemeToggle.tsx.
const THEME_SCRIPT = `try{document.documentElement.setAttribute('data-theme',localStorage.getItem('ag-theme')==='light'?'light':'dark')}catch(e){document.documentElement.setAttribute('data-theme','dark')}`

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: THEME_SCRIPT sets data-theme before React hydrates.
    <html lang="en" style={{ backgroundColor: '#ffffff' }} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body suppressHydrationWarning>
        {children}
        <ChatContainer />
      </body>
    </html>
  )
}
