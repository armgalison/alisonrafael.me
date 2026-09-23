import { expect, test } from '@playwright/test'
import { jsonLd, watchForPageErrors } from './support'

test.describe('Resume (/)', () => {
  test('renders every section server-side and hydrates cleanly', async ({ page }) => {
    const assertNoErrors = watchForPageErrors(page)
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)

    await expect(page).toHaveTitle('Alison Rafael Marinho Gonçalves — Full Stack Software Engineer')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Alison\s*Gonçalves/)
    for (const title of ['By the numbers.', 'Experience.', 'Skills.', 'Credentials.', 'Get in Touch.']) {
      await expect(page.getByRole('heading', { level: 2, name: title })).toBeVisible()
    }
    await expect(page.getByRole('img', { name: /Portrait of Alison Rafael Marinho Gonçalves/ })).toBeVisible()

    assertNoErrors()
  })

  test('works without JavaScript (content is server-rendered)', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Experience.' })).toBeVisible()
    await context.close()
  })

  test('header links to the Blog subdomain and the resume PDF', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: /blog/i }).first()).toHaveAttribute('href', 'https://blog.alisonrafael.me')
    await expect(page.locator('header a[download]')).toHaveAttribute('href', /\/resume$/)
  })

  test('has SEO metadata and Person structured data', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://alisonrafael.me')
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Alison Rafael/)
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://alisonrafael.me/avatar.png')
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0)

    const [data] = await jsonLd(page)
    const graph = data['@graph'] as Array<Record<string, unknown>>
    const person = graph.find((node) => node['@type'] === 'Person')
    expect(person).toMatchObject({
      '@id': 'https://alisonrafael.me/#person',
      name: 'Alison Rafael Marinho Gonçalves',
      alternateName: expect.arrayContaining(['Alison Rafael']),
      sameAs: expect.arrayContaining([expect.stringContaining('linkedin.com')]),
    })
    expect(graph.map((node) => node['@type'])).toEqual(expect.arrayContaining(['ProfilePage', 'WebSite']))
  })
})
