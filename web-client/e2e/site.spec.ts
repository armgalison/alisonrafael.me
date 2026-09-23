import { expect, test } from '@playwright/test'
import { seededPost } from './support'

test.describe('Not found', () => {
  test('an unknown route renders the 404 page with a link home', async ({ page }) => {
    const response = await page.goto('/e2e-no-such-page')
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { name: 'Page not found.' })).toBeVisible()
    await page.getByRole('link', { name: '← Back to the resume' }).click()
    await expect(page).toHaveURL('/')
  })
})

test.describe('Crawler files', () => {
  test('robots.txt disallows /admin/ and points at the sitemap', async ({ request }) => {
    const body = await (await request.get('/robots.txt')).text()
    expect(body).toContain('Disallow: /admin/')
    expect(body).toContain('Sitemap: https://alisonrafael.me/sitemap.xml')
  })

  test('sitemap.xml lists the resume, the Blog and the seeded post', async ({ request }) => {
    const response = await request.get('/sitemap.xml')
    expect(response.status()).toBe(200)
    const body = await response.text()
    expect(body).toContain('<loc>https://alisonrafael.me</loc>')
    expect(body).toContain('<loc>https://blog.alisonrafael.me</loc>')
    expect(body).toContain(`<loc>https://blog.alisonrafael.me/${seededPost().slug}</loc>`)
  })
})

// src/proxy.ts routes by Host header, so these send the production hosts,
// plus the x-forwarded-proto nginx-proxy adds in front of TLS termination
// (without it, Next's own server reports http).
const behindProxy = { 'x-forwarded-proto': 'https' }

test.describe('Host routing (proxy.ts)', () => {
  test('blog.alisonrafael.me/ serves the Blog list', async ({ request }) => {
    const response = await request.get('/', { headers: { host: 'blog.alisonrafael.me' } })
    expect(response.status()).toBe(200)
    expect(await response.text()).toContain('<title>Blog — Alison Rafael</title>')
  })

  test('blog.alisonrafael.me/<slug> serves the post', async ({ request }) => {
    const post = seededPost()
    const response = await request.get(`/${post.slug}`, { headers: { host: 'blog.alisonrafael.me' } })
    expect(response.status()).toBe(200)
    expect(await response.text()).toContain(post.title)
  })

  test('apex /blog/<slug> 308-redirects to the Blog subdomain', async ({ request }) => {
    const response = await request.get('/blog/some-post?x=1', {
      headers: { ...behindProxy, host: 'alisonrafael.me' },
      maxRedirects: 0,
    })
    expect(response.status()).toBe(308)
    expect(response.headers().location).toBe('https://blog.alisonrafael.me/some-post?x=1')
  })

  test('www redirects to the apex', async ({ request }) => {
    const response = await request.get('/#top', {
      headers: { ...behindProxy, host: 'www.alisonrafael.me' },
      maxRedirects: 0,
    })
    expect(response.status()).toBe(308)
    expect(response.headers().location).toBe('https://alisonrafael.me/')
  })
})

test.describe('POST /api/revalidate-resume', () => {
  test('busts the resume cache', async ({ request }) => {
    const response = await request.post('/api/revalidate-resume')
    expect(response.status()).toBe(200)
    expect(await response.json()).toEqual({ revalidated: true })
  })
})
