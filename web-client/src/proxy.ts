import { NextResponse, type NextRequest } from 'next/server'

const WWW_HOST = 'www.alisonrafael.me'
const APEX_HOST = 'alisonrafael.me'

// generateMetadata's canonical/og:url (see src/app/blog/[slug]/page.tsx and
// src/app/layout.tsx) assume one stable host. docker-compose.yml answers on
// both alisonrafael.me and www.alisonrafael.me with no redirect between
// them, so this app owns its own canonicalization instead of adding an
// nginx-proxy rule (ADR 0013) — replaces the abandoned ADR 0011/0012
// approach, which would have done this at the nginx layer.
//
// nginx-proxy terminates TLS and forwards plain HTTP to this container, so
// request.nextUrl's own protocol reflects that internal hop, not what the
// visitor actually used — the redirect target is built from
// x-forwarded-proto instead, defaulting to https since production always
// sits behind TLS termination.
export function proxy(request: NextRequest) {
  const host = request.headers.get('host')
  if (host !== WWW_HOST) return NextResponse.next()

  const protocol = request.headers.get('x-forwarded-proto') ?? 'https'
  const target = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, `${protocol}://${APEX_HOST}`)
  return NextResponse.redirect(target, 308)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
