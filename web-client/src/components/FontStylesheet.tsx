'use client'

// Loads the Google Fonts stylesheet non-render-blocking: `media="print"`
// makes the browser fetch it at low priority, then the onLoad handler
// swaps it to `media="all"` once it's actually available — same technique
// the pre-migration index.html used via a raw `onload="..."` HTML
// attribute; needs a Client Component here since an event-handler prop on
// a host element can't be attached from a Server Component (RootLayout
// itself stays server-rendered).
export function FontStylesheet({ href }: { href: string }) {
  return (
    <link
      href={href}
      rel="stylesheet"
      media="print"
      onLoad={(e) => {
        e.currentTarget.media = 'all'
      }}
    />
  )
}
