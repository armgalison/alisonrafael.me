# web-client e2e tests

Playwright tests for every page: the resume, the Blog list and posts, the
404 pages, `robots.txt`/`sitemap.xml`, the host routing in `src/proxy.ts`,
`POST /api/revalidate-resume`, and the Admin Panel (login, logout, the
signed-out redirects, every protected page, and the post editor).

## Running

From `web-client/`, with the API running on port 3000 (`npm run dev:api`
from the repo root, plus its MariaDB):

```sh
npm run build:e2e   # a production build pointed at the local API
npm run test:e2e
```

A plain `npm run build` isn't enough: it bakes in `.env.production`'s
production API URL, so the pages would read production data while the
suite seeds the local database. Point both somewhere else with
`E2E_API_URL`.

Playwright starts the built app with `npm run start` on port 5173, or
reuses one that's already running there.

## What it needs

- **Admin credentials**: `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`, falling
  back to `ADMIN_EMAIL`/`ADMIN_PASSWORD` (which `.envrc` exports).
- **Chromium for Playwright**: `npx playwright install chromium` if it isn't
  cached yet.

## What it writes

`global-setup.ts` publishes one post (`e2e-post-<timestamp>`) and
`global-teardown.ts` deletes it. The editor test creates a draft
(`e2e-draft-<timestamp>`) and deletes it itself. Nothing else is changed.
The suite never submits a comment (the API allows 5 per IP per hour), a
password change, a Resume Profile save, or a Claude-backed tool.
