# CLAUDE.md

Guidance for Claude Code (and any Dev Agent) working in this repository. It is deliberately short: it holds what you must know **before touching code** — commands, where things live, and the traps that break the build or the behavior. What the code does is in the code; *why* it is that way is in [`CONTEXT.md`](./CONTEXT.md) (vocabulary) and [`docs/adr/`](./docs/adr/) (decisions) — read those before changing scope or infrastructure. If you add or remove a trap below, keep this file in sync; don't grow it into a description of the code.

## Project

A resume site for Alison Rafael Marinho Gonçalves, sourced from a LinkedIn export, plus a v2 backend: admin auth, the Blog, an Admin Panel, Claude-backed Tools, and Live Cursors. `/home/argmalison/projects/alisonrafael.me` (an earlier Angular/NestJS/Mongo attempt) is abandoned — ignore it.

## Human gates — never skip

Without Alison's explicit go-ahead, every time, never: `git commit`, `git push`, create an issue, open a PR, merge, or touch anything about deploys or secrets (a merge to `main` deploys straight to production). Everything short of that — reading, editing, building, linting, testing — is fine. This is enforced by `.claude/settings.json` (`permissions.ask`) plus `.claude/hooks/gate-check.sh`; don't work around either. Definition: `CONTEXT.md` → **Human gate**.

## Repo layout

npm workspaces ([ADR 0002](./docs/adr/0002-npm-workspaces-monorepo.md)): `web-client`, `server`, `shared` ([ADR 0008](./docs/adr/0008-shared-workspace-for-cross-app-data.md)). **`shared` must be built (`npm run build:shared`) before either consumer** — both import its compiled `dist/`, not its source.

## Commands

From the repo root:

- `npm run dev:web` — Next.js dev server, pinned to port **5173** (Next's 3000 default collides with the API)
- `npm run dev:api` — NestJS watch mode (port 3000)
- `npm run build:shared` / `build:web` / `build:api` / `build`

Per workspace (`--workspace=<name>` or `cd`): `web-client` has `lint` (oxlint), `typecheck` (`tsc --noEmit`) and `test:e2e` (Playwright); `server` has `lint` (oxlint), `test` (vitest) and `test:e2e`. `server`'s `test:e2e` boots the whole app and needs a MariaDB plus the env from `server/.env.example` (`docker-compose.local.yml` provides the database). CI (`.github/workflows/ci.yml`) runs all of the above on every PR and before every deploy, except `web-client`'s `test:e2e`, which is local-only for now. Test coverage is still thin (one e2e spec in `server/`, no unit tests), so a green build proves little — verify UI changes in a browser.

`web-client`'s `test:e2e` covers every page through a browser. It needs a running API and a build from `npm run build:e2e`, which bakes in the local API URL; a plain `npm run build` points the pages at the production API. It also needs the admin credentials in env and writes to that API's database. Details in `web-client/e2e/README.md`.

`web-client`'s `npm run start` runs the same `output: 'standalone'` build Docker ships. Plain `next start` does **not** work with that config; the script copies `.next/static` and `public/` into the standalone tree by hand, like `web-client/Dockerfile`.

## Stack

- **`web-client`**: Next.js 16 (App Router, `output: 'standalone'`) + React 19 + TypeScript + Tailwind v4 + Framer Motion (Admin Panel only). [ADR 0013](./docs/adr/0013-migrate-web-client-to-nextjs-app-router.md).
- **`server`**: NestJS + TypeORM + MariaDB (`mysql2`) + JWT auth + `class-validator` + `@anthropic-ai/sdk` + Socket.IO. [ADR 0003](./docs/adr/0003-mariadb-typeorm-backend-datastore.md), [0007](./docs/adr/0007-anthropic-api-for-trend-discovery.md).

## Where things live

- `web-client/src/app/` — routes only; mostly thin composition or re-exports. `admin/` re-exports `src/admin/`.
- `web-client/src/components/` — the public site (Server Components). `content/` + `i18n/` — static UI copy. `blog/` — the Blog's API client, URL helpers and client islands. `admin/` — the Admin Panel. `live-cursors/` — the Live Cursor overlay. `proxy.ts` — host routing (below).
- `server/src/` — one Nest module per folder: `auth`, `blog`, `comments`, `uploads`, `trends`, `tools`, `ats-resume`, `resume-profile`, `live-cursors`, `health`.
- `shared/src/` — `tech-stack.ts` (the Tech Stack) and `resume.ts` (the Resume Profile type and its seed default).

Feature background: Admin Panel [0005](./docs/adr/0005-admin-panel-in-web-client.md)/[0006](./docs/adr/0006-admin-session-model.md), Comments [0009](./docs/adr/0009-reader-comments-pre-moderated-pseudonymous-one-level-rate-limited.md), View count [0010](./docs/adr/0010-view-counter-intentionally-undeduplicated.md), ATS resume [0014](./docs/adr/0014-ats-resume-generator-replaces-static-download.md), Resume Profile [0015](./docs/adr/0015-resume-profile-becomes-db-backed-and-editable.md), Live Cursors [0017](./docs/adr/0017-live-cursors-unauthenticated-per-room-websocket-gateway.md), uploads [0004](./docs/adr/0004-local-disk-image-storage.md).

## Traps — `web-client`

- **Next.js 16 has breaking changes.** Read the relevant guide in `node_modules/next/dist/docs/` (hoisted to the repo root) before writing Next code (see `web-client/AGENTS.md`). `middleware.ts` is now `src/proxy.ts`, exporting `proxy`.
- **Server Components by default.** Add `'use client'` only for hooks or browser APIs. A Client Component is still rendered once on the server, so its first render must be **identical on server and client**: never read `window`, `localStorage` or `navigator` in render or in a `useState` initializer. Start with the server value and detect in `useEffect`. (A `navigator.share` check in an initializer caused a real hydration failure in `ShareButtons`.)
- **Tailwind v4 is CSS-first**: tokens live in `src/app/globals.css` under `@theme`; there is no `tailwind.config.js`. The public site is strictly black-and-white, system font stacks, square corners, 1px rules, no scroll/entrance animation. `--color-accent*` are aliases of ink — keep them, the Admin Panel's buttons use them.
- **`--header-h`** (`globals.css`) must match `SiteHeader`'s rendered height; `Hero` sizes itself to `100svh - --header-h`. Change one, change the other.
- **`NEXT_PUBLIC_API_URL`** is baked in at build time from the committed `.env.production`/`.env.development`; there is no runtime injection.
- **Resume facts are a live API fetch, not a static import.** Use the async `getResumeContent()` (`src/i18n`); `useResumeContent` returns only the static UI copy. `content/resumeProfileApi.ts` caches under the `resume-profile` tag and falls back to `shared`'s seed on any failure (the build prerenders against the *previous* deployed API on a route's first deploy). Saving the Resume Profile in Settings calls `POST /api/revalidate-resume`, which uses `revalidateTag(..., { expire: 0 })`.
- **Blog host** ([ADR 0016](./docs/adr/0016-blog-on-dedicated-subdomain.md)): production serves the Blog at `blog.alisonrafael.me`, where `proxy.ts` internally rewrites `/x` to `/blog/x`; apex/`www` `/blog*` 308-redirects to the subdomain, and `www` 308-redirects to the apex. Build in-Blog links with `blogPathPrefix()` (`blog/routes.ts`) and absolute/canonical URLs with `blog/url.ts` — never hard-code `/blog` (it doubles up to `/blog/blog`). `proxy.ts` reads the protocol from `x-forwarded-proto` because nginx-proxy terminates TLS.
- **Blog pages** fetch with `{ cache: 'no-store' }` and set per-post metadata in `generateMetadata` (the Link preview; [ADR 0013](./docs/adr/0013-migrate-web-client-to-nextjs-app-router.md)). `react-markdown` runs server-side only. `ViewRegistrar` must stay a genuine client component. Keep `blog/api.ts` and `admin/api.ts` separate.
- **`/admin/*` is entirely client-rendered** (JWT in `localStorage`, so the server can't see it). `AuthContext` guards its `localStorage` read with `typeof window === 'undefined'`; the protected tree sits behind `Gate`. The markdown editor (`@uiw/react-md-editor`) loads through `next/dynamic({ ssr: false })` from a `'use client'` file.
- **Live Cursors**: `LiveCursorOverlay` is the only client island on the resume page and is never mounted under `/admin/*`.

## Traps — `server`

- **`module: nodenext`**: every relative import needs an explicit `.js` extension.
- **Route order matters.** `BlogController` and `CommentsController` declare admin/literal routes *before* the `:slug` ones; Nest matches top-down.
- **`JWT_EXPIRES_IN_SECONDS` must be `Number(...)`-converted** — a numeric *string* is read as milliseconds by `@nestjs/jwt`.
- **`AuthModule` exports the pre-registered `PassportModule`**: import `AuthModule` to get `JwtAuthGuard`; never re-register `PassportModule`.
- **The global `ValidationPipe` uses `whitelist` + `forbidNonWhitelisted`**, so a DTO must declare every field, including full nested trees (see `UpdateResumeProfileDto`).
- **`main.ts` sets `trust proxy`**; without it, uploaded image URLs come back as `http://` behind nginx-proxy.
- **`Comment.authorEmail` is `select: false`** — it must never be returned by a public route.
- **Claude calls**: system prompts demand a bare JSON reply, parsed with `extractJson()` (`trends.service.ts`). The two trend `POST`s rethrow failures as `BadGatewayException` with Claude's real message — deliberate, this is a single-admin tool. Tools that use resume facts read them live via `ResumeProfileService.get()`. The ATS Resume Generator must never add an employer, title, skill, achievement or date the Resume Profile doesn't contain.
- **Uploads and `resume.pdf`** live on the persistent volume under `UPLOADS_DIR` (default `./uploads`); the public resume URL is always `GET /resume`.
- **The comment rate limit is a hardcoded constant.** If it ever becomes configurable, update both `.env.example` files, `docker-compose.yml`'s `api` env block, `deploy.yml`'s `.env` heredoc and the GitHub secret together.

## Deployment

One DigitalOcean droplet, Dockerized: `web`, `api` and `mariadb` behind a shared `nginx-proxy` + `acme-companion` stack deployed once, separately ([ADR 0001](./docs/adr/0001-nginx-proxy-acme-companion-for-tls.md), `deploy/proxy/README.md`).

- `web` answers on `alisonrafael.me`, `www.` and `blog.`; `api` on `api.alisonrafael.me`; `mariadb` is only on the internal network. `web` sets `VIRTUAL_PORT: 3000` explicitly.
- **Both Dockerfiles use the repo root as build context** (they need `shared/`), e.g. `docker build -f server/Dockerfile .`. The server image also copies `server/assets` (the boot-time seed PDF).
- `.github/workflows/deploy.yml` runs on **every push to `main`**. It first calls `ci.yml` (`needs: ci`, [ADR 0018](./docs/adr/0018-deploy-depends-on-ci.md)) — nothing ships if that is red — then builds and pushes both images to GHCR, `scp`s `docker-compose.yml`, regenerates the droplet's `.env` from GitHub Actions secrets (never hand-edit it), and runs `docker compose pull && up -d`. Secrets: `DROPLET_HOST`, `DROPLET_USER`, `DROPLET_SSH_KEY`, `DROPLET_APP_DIR`, `DB_ROOT_PASSWORD`, `DB_PASSWORD`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ANTHROPIC_API_KEY`. The root `.env.example` is the shape of that droplet `.env`; `server/.env.example` is for running the API locally without Docker.
- `deploy/proxy/vhost.d/api.alisonrafael.me` raises proxy timeouts to 180s for the trend endpoints; a normal deploy does not apply changes to that stack.

## Working process

Scope was defined by structured "grilling" interviews, not freeform requirements. Before adding features or changing architecture, check `CONTEXT.md` and `docs/adr/` — they record *why*. Update `CONTEXT.md` as terms are resolved, and write an ADR only when a decision is hard to reverse, surprising without context, and a real trade-off.
