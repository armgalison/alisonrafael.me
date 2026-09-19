import type { MetadataRoute } from 'next'
import { blogApi } from '../blog/api'
import { blogListUrl, blogPostUrl } from '../blog/url'

const SITE_ORIGIN = 'https://alisonrafael.me'

// Canonical URLs only — never the www/apex-blog-prefix hosts that
// src/proxy.ts 308-redirects away from (ADR 0016), since a sitemap should
// only ever list a page's final address, not a redirect source.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await blogApi.listPosts({ cache: 'no-store' }).catch(() => [])

  return [
    {
      url: SITE_ORIGIN,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: blogListUrl(),
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    ...posts.map((post) => ({
      url: blogPostUrl(post.slug),
      lastModified: new Date(post.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]
}
