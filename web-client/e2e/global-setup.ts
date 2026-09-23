import { API_URL, apiLogin } from './support'

// Publishes one throwaway post so the Blog pages have known content, and
// logs in once so admin specs can reuse the token. Environment variables set
// here reach every worker. global-teardown.ts deletes the post.
export default async function globalSetup() {
  const token = await apiLogin()
  const slug = `e2e-post-${Date.now()}`
  const title = `E2E post ${slug}`

  const res = await fetch(`${API_URL}/posts/admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      title,
      slug,
      excerpt: 'A post the end-to-end suite publishes and deletes.',
      content: '# A markdown heading\n\nSome body text with a [link](https://example.com).\n\n## A subheading\n\nMore text.',
      published: true,
    }),
  })
  if (!res.ok) throw new Error(`Seeding the e2e post failed: ${res.status} ${await res.text()}`)
  const post = (await res.json()) as { id: number | string }

  process.env.E2E_ADMIN_TOKEN = token
  process.env.E2E_POST_ID = String(post.id)
  process.env.E2E_POST_SLUG = slug
  process.env.E2E_POST_TITLE = title
}
