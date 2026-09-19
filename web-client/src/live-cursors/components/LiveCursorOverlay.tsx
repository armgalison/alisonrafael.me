'use client'

import { useEffect, useState } from 'react'
import { connectLiveCursorSocket } from '../socket'
import type { CursorState } from '../types'
import { CursorArrow } from './CursorArrow'

// Matches the server's per-connection throttle (server/src/live-cursors/
// live-cursors.gateway.ts) — this is just a courtesy so the client isn't
// firing events the server would drop anyway.
const MOVE_INTERVAL_MS = 50

interface RemoteCursor extends CursorState {
  id: string
}

// A Live Cursor is 1:1 with one WebSocket connection's lifetime, scoped to
// exactly one room — mount this with a `key` that changes whenever `room`
// does (see src/app/blog/[slug]/page.tsx) so React tears down and
// reconnects rather than reusing one socket across rooms. See CONTEXT.md's
// "Live Cursor" entry and docs/adr/0017.
export function LiveCursorOverlay({ room }: { room: string }) {
  const [cursors, setCursors] = useState<Map<string, RemoteCursor>>(new Map())
  const [docHeight, setDocHeight] = useState(0)

  useEffect(() => {
    // Touch/coarse-pointer devices get zero value from "see someone else's
    // mouse" — not opening a socket at all is simpler than a receive-only
    // connection, and saves a connection/battery/data on a device class
    // that can never send its own position anyway.
    if (typeof window === 'undefined' || window.matchMedia('(pointer: coarse)').matches) return

    // Positions are normalized against the full scrollable document, not
    // just the viewport, and the overlay below is `position: absolute`
    // (scrolls with the page) rather than `fixed` (pinned to the
    // viewport) — an arrow near the bottom of a long page only comes into
    // view once you actually scroll there, instead of being clamped into
    // whatever's currently on screen.
    function updateDocHeight() {
      setDocHeight(document.documentElement.scrollHeight)
    }
    updateDocHeight()
    const resizeObserver = new ResizeObserver(updateDocHeight)
    resizeObserver.observe(document.documentElement)
    window.addEventListener('resize', updateDocHeight)

    const socket = connectLiveCursorSocket(room)

    socket.on('cursor:snapshot', (snapshot: RemoteCursor[]) => {
      setCursors(new Map(snapshot.map((cursor) => [cursor.id, cursor])))
    })
    socket.on('cursor:moved', (cursor: RemoteCursor) => {
      setCursors((prev) => new Map(prev).set(cursor.id, cursor))
    })
    socket.on('cursor:left', ({ id }: { id: string }) => {
      setCursors((prev) => {
        if (!prev.has(id)) return prev
        const next = new Map(prev)
        next.delete(id)
        return next
      })
    })

    let lastSentAt = 0
    function handleMouseMove(event: MouseEvent) {
      const now = Date.now()
      if (now - lastSentAt < MOVE_INTERVAL_MS) return
      lastSentAt = now
      socket.emit('cursor:move', {
        xPct: (event.pageX / document.documentElement.scrollWidth) * 100,
        yPct: (event.pageY / document.documentElement.scrollHeight) * 100,
      })
    }
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', updateDocHeight)
      resizeObserver.disconnect()
      socket.disconnect()
      setCursors(new Map())
    }
  }, [room])

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-50"
      style={{ height: docHeight || '100%' }}
      aria-hidden
    >
      {Array.from(cursors.values()).map((cursor) => (
        <CursorArrow key={cursor.id} color={cursor.color} xPct={cursor.xPct} yPct={cursor.yPct} />
      ))}
    </div>
  )
}
