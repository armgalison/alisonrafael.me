// Pure, host-agnostic URL builders — safe to import from Client Components
// (see src/blog/routes.ts for the next/headers-based path helpers, which
// aren't: importing next/headers into a Client Component's module graph is
// a build error).
const BLOG_HOST = 'blog.alisonrafael.me'

// The Blog's public, canonical origin — used for share links and
// generateMetadata's canonical/og:url, always pinned here regardless of
// which host actually served the request (mirrors the old SITE_ORIGIN
// pattern this replaced in ShareButtons.tsx).
export const BLOG_ORIGIN = `https://${BLOG_HOST}`

export function blogListUrl() {
  return BLOG_ORIGIN
}

export function blogPostUrl(slug: string) {
  return `${BLOG_ORIGIN}/${slug}`
}
