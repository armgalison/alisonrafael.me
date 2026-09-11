import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { FontStylesheet } from '../components/FontStylesheet'
import './globals.css'

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap'

const SITE_NAME = 'Alison Rafael Marinho Gonçalves — Full-Stack Engineer'
const SITE_DESCRIPTION =
  'Alison Rafael Marinho Gonçalves — Full-Stack Engineer. Resume, experience, and skills.'

// Site-wide fallback link-preview tags — apply to every route that doesn't
// set its own metadata (the resume, the /blog list, a 404). A Post's
// reading page (/blog/[slug]) overrides these with real per-post values via
// its own generateMetadata — see docs/adr/0013-migrate-web-client-to-nextjs-app-router.md
// (which replaced the old ADR 0011/0012 approach of injecting these same
// tags into an otherwise still-client-rendered SPA shell).
export const metadata: Metadata = {
  metadataBase: new URL('https://alisonrafael.me'),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
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
    url: 'https://alisonrafael.me',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
  },
  twitter: {
    card: 'summary',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" style={{ backgroundColor: '#08090d' }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" as="style" href={FONT_HREF} />
        <FontStylesheet href={FONT_HREF} />
        <noscript>
          <link href={FONT_HREF} rel="stylesheet" />
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  )
}
