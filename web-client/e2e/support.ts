import { expect, type Page } from '@playwright/test'

// The API the built web-client talks to. It must match the build's baked-in
// NEXT_PUBLIC_API_URL (.env.production for `npm run build`), since the pages
// fetch from that one while these helpers seed data through this one.
export const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000'

// Must match TOKEN_STORAGE_KEY in src/admin/AuthContext.tsx.
export const TOKEN_STORAGE_KEY = 'admin.token'

export function adminCredentials() {
  const email = process.env.E2E_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL
  const password = process.env.E2E_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD
  if (!email || !password) {
    throw new Error('Set E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD (or ADMIN_EMAIL/ADMIN_PASSWORD) for the e2e suite.')
  }
  return { email, password }
}

export async function apiLogin(): Promise<string> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(adminCredentials()),
  })
  if (!res.ok) throw new Error(`Admin login failed: ${res.status} ${await res.text()}`)
  const { accessToken } = (await res.json()) as { accessToken: string }
  return accessToken
}

// The post global-setup.ts publishes for this run.
export function seededPost() {
  const id = process.env.E2E_POST_ID
  const slug = process.env.E2E_POST_SLUG
  const title = process.env.E2E_POST_TITLE
  if (!id || !slug || !title) throw new Error('global-setup.ts did not seed a post')
  return { id, slug, title }
}

// Fails the test on an uncaught page error or a React hydration mismatch,
// the class of bug the CLAUDE.md traps warn about.
export function watchForPageErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error' && /hydrat/i.test(msg.text())) errors.push(msg.text())
  })
  return () => expect(errors, 'page errors').toEqual([])
}

export async function jsonLd(page: Page): Promise<Array<Record<string, unknown>>> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents()
  return blocks.map((text) => JSON.parse(text) as Record<string, unknown>)
}

// Logs the browser into the Admin Panel by planting the JWT the way
// AuthContext does after a real login.
export async function loginAsAdmin(page: Page) {
  const token = process.env.E2E_ADMIN_TOKEN
  if (!token) throw new Error('global-setup.ts did not store an admin token')
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [TOKEN_STORAGE_KEY, token] as const,
  )
}
