import { expect, test } from '@playwright/test'
import { adminCredentials, API_URL, loginAsAdmin, seededPost, watchForPageErrors } from './support'

test.describe('Admin login (/admin/login)', () => {
  test('is not indexable', async ({ page }) => {
    await page.goto('/admin/login')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
  })

  test('rejects wrong credentials', async ({ page }) => {
    await page.goto('/admin/login')
    await page.locator('#email').fill(adminCredentials().email)
    await page.locator('#password').fill('definitely-not-the-password')
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page.getByText('Incorrect email or password.')).toBeVisible()
    await expect(page).toHaveURL('/admin/login')
  })

  test('logs in, lands on Posts, and logs out', async ({ page }) => {
    const { email, password } = adminCredentials()
    await page.goto('/admin/login')
    await expect(page.getByRole('heading', { level: 1, name: 'Admin Panel' })).toBeVisible()
    await page.locator('#email').fill(email)
    await page.locator('#password').fill(password)
    await page.getByRole('button', { name: 'Log in' }).click()

    await expect(page).toHaveURL('/admin/posts')
    await expect(page.getByRole('heading', { level: 1, name: 'Posts' })).toBeVisible()

    await page.getByRole('button', { name: 'Log out' }).click()
    await expect(page).toHaveURL('/admin/login')
  })
})

// Every page behind Gate, with the h1 it should render once signed in.
const protectedPages = [
  { path: '/admin/posts', heading: 'Posts' },
  { path: '/admin/posts/new', heading: 'New post' },
  { path: '/admin/comments', heading: 'Comments' },
  { path: '/admin/settings', heading: 'Settings' },
  { path: '/admin/tools', heading: 'Tools' },
  { path: '/admin/tools/cover-letter', heading: 'Cover Letter Generator' },
  { path: '/admin/tools/ats-resume', heading: 'ATS Resume Generator' },
  { path: '/admin/tools/trends', heading: 'Top trends' },
]

test.describe('Admin pages, signed out', () => {
  for (const { path } of [{ path: '/admin' }, ...protectedPages]) {
    test(`${path} redirects to the login page`, async ({ page }) => {
      await page.goto(path)
      await expect(page).toHaveURL('/admin/login')
    })
  }
})

test.describe('Admin pages, signed in', () => {
  test.beforeEach(async ({ page }) => loginAsAdmin(page))

  test('/admin redirects to Posts', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL('/admin/posts')
  })

  // Rendering only: the Claude-backed tools are never submitted, so the
  // suite costs no API calls.
  for (const { path, heading } of protectedPages) {
    test(`${path} renders`, async ({ page }) => {
      const assertNoErrors = watchForPageErrors(page)
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
      assertNoErrors()
    })
  }

  test('Posts lists the seeded post and opens it in the editor', async ({ page }) => {
    const post = seededPost()
    await page.goto('/admin/posts')
    await page.getByText(post.title).click()
    await expect(page).toHaveURL(`/admin/posts/${post.id}`)
    await expect(page.getByRole('heading', { level: 1, name: 'Edit post' })).toBeVisible()
    await expect(page.locator('#title')).toHaveValue(post.title)
    await expect(page.locator('#slug')).toHaveValue(post.slug)
  })

  test('creates a draft post through the editor', async ({ page, request }) => {
    const slug = `e2e-draft-${Date.now()}`
    await page.goto('/admin/posts/new')
    await page.locator('#title').fill(`E2E draft ${slug}`)
    await page.locator('#slug').fill(slug)
    await page.locator('#excerpt').fill('A draft created by the e2e suite.')
    await page.locator('.w-md-editor-text-input').fill('Draft body.')
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page).toHaveURL('/admin/posts')
    await expect(page.getByText(`E2E draft ${slug}`)).toBeVisible()

    // Clean up through the API, and prove the draft isn't public meanwhile.
    const headers = { Authorization: `Bearer ${process.env.E2E_ADMIN_TOKEN}` }
    const posts = (await (await request.get(`${API_URL}/posts/admin`, { headers })).json()) as Array<{
      id: string
      slug: string
    }>
    const draft = posts.find((p) => p.slug === slug)
    expect(draft).toBeDefined()
    expect((await page.goto(`/blog/${slug}`))?.status()).toBe(404)
    await request.delete(`${API_URL}/posts/admin/${draft!.id}`, { headers })
  })
})
