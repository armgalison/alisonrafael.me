import { expect, test } from '@playwright/test'
import { jsonLd, seededPost, watchForPageErrors } from './support'

test.describe('Blog list (/blog)', () => {
  test('lists the seeded post and links to it', async ({ page }) => {
    const post = seededPost()
    const assertNoErrors = watchForPageErrors(page)
    const response = await page.goto('/blog')
    expect(response?.status()).toBe(200)

    await expect(page).toHaveTitle('Blog — Alison Rafael')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Blog.')

    const link = page.getByRole('link', { name: new RegExp(post.title) })
    await expect(link).toHaveAttribute('href', `/blog/${post.slug}`)
    await link.click()
    await expect(page).toHaveURL(`/blog/${post.slug}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(post.title)

    assertNoErrors()
  })

  test('has its own canonical, og:url and Blog structured data', async ({ page }) => {
    await page.goto('/blog')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://blog.alisonrafael.me')
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://blog.alisonrafael.me')
    expect(await jsonLd(page)).toContainEqual(
      expect.objectContaining({ '@type': 'Blog', author: { '@id': 'https://alisonrafael.me/#person' } }),
    )
  })
})

test.describe('Blog post (/blog/[slug])', () => {
  test('renders the post with a single h1 and a working back link', async ({ page }) => {
    const post = seededPost()
    const assertNoErrors = watchForPageErrors(page)
    const response = await page.goto(`/blog/${post.slug}`)
    expect(response?.status()).toBe(200)

    await expect(page).toHaveTitle(`${post.title} — Alison Rafael`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(post.title)
    // The markdown "#" is demoted so the title stays the only h1.
    await expect(page.getByRole('heading', { level: 2, name: 'A markdown heading' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'link', exact: true })).toHaveAttribute('href', 'https://example.com')

    await page.getByRole('link', { name: '← Back to Blog' }).first().click()
    await expect(page).toHaveURL('/blog')

    assertNoErrors()
  })

  test('has per-post metadata and BlogPosting structured data', async ({ page }) => {
    const post = seededPost()
    await page.goto(`/blog/${post.slug}`)
    const canonical = `https://blog.alisonrafael.me/${post.slug}`

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonical)
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article')
    await expect(page.locator('meta[property="article:modified_time"]')).toHaveCount(1)
    expect(await jsonLd(page)).toContainEqual(
      expect.objectContaining({
        '@type': 'BlogPosting',
        headline: post.title,
        mainEntityOfPage: canonical,
        author: expect.objectContaining({ '@id': 'https://alisonrafael.me/#person' }),
      }),
    )
  })

  test('shows the comment form', async ({ page }) => {
    // Submitting is left out on purpose: the API allows 5 comments per IP
    // per hour, so a few local runs would start failing on the rate limit.
    await page.goto(`/blog/${seededPost().slug}`)
    await expect(page.getByRole('heading', { level: 2, name: 'Comments.' })).toBeVisible()
    await expect(page.getByPlaceholder('Name')).toBeVisible()
    await expect(page.getByPlaceholder('Email')).toBeVisible()
    await expect(page.getByPlaceholder('Write a comment…')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Post comment' })).toBeVisible()
  })

  test('an unknown slug is a 404 with the Blog\'s own not-found page', async ({ page }) => {
    const response = await page.goto('/blog/e2e-no-such-post')
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { level: 1, name: 'Post not found.' })).toBeVisible()
    await page.getByRole('link', { name: '← Back to Blog' }).click()
    await expect(page).toHaveURL('/blog')
  })
})
