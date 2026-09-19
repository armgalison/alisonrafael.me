import { io, type Socket } from 'socket.io-client'

// Forces the 'websocket' transport, skipping Socket.IO's long-polling
// fallback/upgrade probe: on a network that blocks WS upgrades, this purely
// cosmetic feature just silently shows no cursors instead of falling back
// to persistent long-polling traffic through the reverse proxy.
export function connectLiveCursorSocket(room: string): Socket {
  return io(`${process.env.NEXT_PUBLIC_API_URL}/live-cursors`, {
    query: { room },
    transports: ['websocket'],
  })
}
