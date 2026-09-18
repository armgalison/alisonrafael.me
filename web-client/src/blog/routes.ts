import { headers } from 'next/headers'

// Server Component only — see src/blog/url.ts for the client-safe URL
// builders (BLOG_ORIGIN, blogListUrl, blogPostUrl).
const BLOG_HOST = 'blog.alisonrafael.me'

// Same-origin in-page navigation within the Blog route tree. In production
// blog.alisonrafael.me/foo is rewritten internally to /blog/foo by
// src/proxy.ts, so the browser's address bar never shows "/blog" — links
// built here must match that (no prefix). Anywhere else (local dev at
// localhost:5173/blog, no rewrite in play) the real path IS "/blog"-
// prefixed. Getting this wrong makes a click double up to ".../blog/blog".
//
// '' when rewritten off blog.alisonrafael.me, '/blog' everywhere else.
// Exported for callers that build several hrefs off one request (e.g. a
// post list) and don't want to re-read headers() per item.
export async function blogPathPrefix() {
  const host = (await headers()).get('host')
  return host === BLOG_HOST ? '' : '/blog'
}

export async function blogListPath() {
  return `${await blogPathPrefix()}/`
}

export async function blogPostPath(slug: string) {
  return `${await blogPathPrefix()}/${slug}`
}
