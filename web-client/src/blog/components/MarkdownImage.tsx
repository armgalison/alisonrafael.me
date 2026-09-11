'use client'

import { type ComponentProps, useState } from 'react'

// react-markdown's `img` renderer — its own load-in state (reserving
// space, fading in once loaded) needs a Client Component even though the
// rest of the markdown render tree is server-rendered.
export function MarkdownImage(props: ComponentProps<'img'>) {
  const [loaded, setLoaded] = useState(false)
  return (
    <span
      className={`mb-5 block overflow-hidden rounded-xl border border-line bg-surface-raised ${loaded ? '' : 'min-h-60'}`}
    >
      <img {...props} loading="lazy" className="block w-full rounded-xl" onLoad={() => setLoaded(true)} />
    </span>
  )
}
