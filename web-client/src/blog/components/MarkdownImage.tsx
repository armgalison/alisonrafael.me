'use client'

import { type ComponentProps, useState } from 'react'

// react-markdown's `img` renderer — its own load-in state (reserving
// space, fading in once loaded) needs a Client Component even though the
// rest of the markdown render tree is server-rendered.
export function MarkdownImage(props: ComponentProps<'img'>) {
  const [loaded, setLoaded] = useState(false)
  return (
    <span
      className={`block overflow-hidden border border-(--ind-divider) bg-(--ind-surface) ${loaded ? '' : 'min-h-60'}`}
    >
      <img {...props} loading="lazy" className="block w-full" onLoad={() => setLoaded(true)} />
    </span>
  )
}
