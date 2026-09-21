'use client'

import { Maximize2, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface CoverImageProps {
  src: string
  alt: string
}

const iconButtonClass =
  'flex h-9 w-9 items-center justify-center bg-black/85 text-white transition-colors group-hover:bg-white group-hover:text-black'

// The Post's cover as shown in the detail page's hero: shown whole (letterboxed
// on black when its ratio doesn't match the column) in its original colors, and
// clickable to open a fullscreen view. The viewer is a native <dialog> opened
// with showModal(), so Esc, focus trapping and the top-layer stacking above the
// Live Cursor overlay come for free; a click anywhere on it closes it.
export function CoverImage({ src, alt }: CoverImageProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  // Restore page scroll however the dialog ends up closed (Esc, click, unmount).
  useEffect(() => {
    return () => {
      document.documentElement.style.overflow = ''
    }
  }, [])

  function open() {
    document.documentElement.style.overflow = 'hidden'
    dialogRef.current?.showModal()
  }

  return (
    <figure className="relative m-0 overflow-hidden border-rule bg-black max-[720px]:border-t min-[721px]:border-l">
      {/* Out of flow on desktop so the row is sized by the viewport and the
          text column, not the image's own ratio; in flow on mobile so the whole
          image shows at its natural height with no bars. */}
      <img
        src={src}
        alt={alt}
        className="block w-full object-contain max-[720px]:h-auto min-[721px]:absolute min-[721px]:inset-0 min-[721px]:h-full"
      />

      <button
        type="button"
        onClick={open}
        aria-label="View cover image fullscreen"
        className="group absolute inset-0 z-10 cursor-zoom-in"
      >
        <span className={`${iconButtonClass} absolute right-0 bottom-0`}>
          <Maximize2 size={16} aria-hidden="true" />
        </span>
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => {
          document.documentElement.style.overflow = ''
        }}
        onClick={() => dialogRef.current?.close()}
        aria-label={alt}
        className="m-0 h-svh max-h-none w-svw max-w-none cursor-zoom-out bg-black p-0 backdrop:bg-black"
      >
        <img src={src} alt={alt} className="block h-full w-full object-contain" />
        <span className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center bg-black/85 text-white">
          <X size={18} aria-hidden="true" />
        </span>
      </dialog>
    </figure>
  )
}
