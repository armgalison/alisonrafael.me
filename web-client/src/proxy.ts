import { NextResponse, type NextRequest } from 'next/server'

const WWW_HOST = 'www.alisonrafael.me'
const APEX_HOST = 'alisonrafael.me'
const BLOG_HOST = 'blog.alisonrafael.me'

// generateMetadata's canonical/og:url (see src/app/blog/[slug]/page.tsx and
// src/app/layout.tsx) assume one stable host per route. docker-compose.yml
// answers on alisonrafael.me, www.alisonrafael.me, and blog.alisonrafael.me
// with no redirect between them, so this app owns its own canonicalization
// instead of adding an nginx-proxy rule (ADR 0013) — replaces the abandoned
// ADR 0011/0012 approach, which would have done this at the nginx layer.
//
// nginx-proxy terminates TLS and forwards plain HTTP to this container, so
// request.nextUrl's own protocol reflects that internal hop, not what the
// visitor actually used — every redirect target below is built from
// x-forwarded-proto instead, defaulting to https since production always
// sits behind TLS termination.
export function proxy(request: NextRequest) {
  const host = request.headers.get('host')
  const { pathname, search } = request.nextUrl
  const protocol = request.headers.get('x-forwarded-proto') ?? 'https'

  // blog.alisonrafael.me serves src/app/blog's route tree at its own root
  // (blog.alisonrafael.me/ is the list, blog.alisonrafael.me/:slug is a
  // post) rather than repeating "/blog" in the host that already says so.
  // The rewrite is internal only — the browser's address bar keeps the
  // clean path. Paths with a "." (avatar.png, favicon.ico,
  // site.webmanifest, ...) are left alone so public/ assets still resolve;
  // app routes here never contain a dot.
  if (host === BLOG_HOST) {
    if (pathname.includes('.')) return NextResponse.next()
    const target = new URL(`/blog${pathname}${search}`, request.url)
    return NextResponse.rewrite(target)
  }

  // Old /blog URLs on the apex/www host redirect to the subdomain — one
  // canonical URL per post. Checked before the www->apex branch below so
  // www.alisonrafael.me/blog/x reaches the subdomain in a single hop.
  if ((host === APEX_HOST || host === WWW_HOST) && (pathname === '/blog' || pathname.startsWith('/blog/'))) {
    const newPath = pathname.slice('/blog'.length) || '/'
    const target = new URL(`${newPath}${search}`, `${protocol}://${BLOG_HOST}`)
    return NextResponse.redirect(target, 308)
  }

  if (host !== WWW_HOST) return NextResponse.next()

  const target = new URL(`${pathname}${search}`, `${protocol}://${APEX_HOST}`)
  return NextResponse.redirect(target, 308)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
