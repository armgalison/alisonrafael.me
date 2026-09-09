# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A resume site for Alison Rafael Marinho Gonçalves, sourced from his LinkedIn export, plus a v2 backend (auth + Blog) now under active development. Content, audience, and stack decisions were made deliberately — see [`CONTEXT.md`](./CONTEXT.md) for domain vocabulary (including the v1/v2 split) and [`docs/adr/`](./docs/adr/) for architectural decisions before changing scope or infrastructure.

Note: `/home/argmalison/projects/alisonrafael.me` (an earlier Angular/NestJS/Mongo attempt at the same site) exists on disk but is abandoned in favor of this project.

## Repo layout

npm workspaces monorepo — see [ADR 0002](./docs/adr/0002-npm-workspaces-monorepo.md) for why. Two workspaces, `web-client` and `server`, orchestrated from the root `package.json`.

## Commands

Run from the repo root:

- `npm run dev:web` — Vite dev server for `web-client`
- `npm run dev:api` — NestJS dev server (watch mode) for `server`
- `npm run build:web` / `npm run build:api` — build one workspace
- `npm run build` — build both

Per-workspace commands (`npm run lint`, `npm run preview`, NestJS's `npm run test`/`test:e2e`, etc.) still work via `--workspace=web-client` / `--workspace=server`, or `cd` into the workspace directly.

## Stack

- **`web-client`**: Vite + React 19 + TypeScript + React Router + Tailwind CSS v4 (CSS-first config via `@theme` in `src/index.css`, no `tailwind.config.js`) + Framer Motion.
- **`server`**: NestJS + TypeORM + MariaDB (`mysql2` driver) + JWT auth (`@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`) + `class-validator`/`class-transformer`. See [ADR 0003](./docs/adr/0003-mariadb-typeorm-backend-datastore.md) for the datastore choice. `server/tsconfig.json` uses `"module": "nodenext"` — every relative import needs an explicit `.js` extension, including in files that don't exist yet.

## Architecture

### `web-client/`

- `src/content/en.ts` — the single source of truth for all resume copy, typed by `src/content/types.ts` (`ResumeContent`). Content changes are code changes to this file (the Blog, once it has an admin UI, will be the exception — it's server-managed, not code).
- `src/i18n/index.ts` — locale registry (`useResumeContent`). Only `en` exists today; adding a language means adding `src/content/<locale>.ts` and registering it here — no i18n library is used, by design.
- `src/pages/ResumePage.tsx` — the entire site is one page: `Hero` and `Stats` full-width, then a two-column desktop layout (`Experience` left; a sticky sidebar with `Skills` and `Credentials` right, which stacks below Experience on mobile), then a full-width `Contact` close. `src/App.tsx` still runs everything through React Router (with a `NotFoundPage` catch-all) even though there's only one real route, so routing is already wired for future pages (e.g. a future Blog reading UI backed by `server`'s public `/posts` routes).
- `src/components/Experience.tsx` — roles are split into `emphasized` (shown open) vs. not (collapsed behind "Show earlier roles"), driven by the `emphasized` flag on each entry in `en.ts` rather than a computed date cutoff — update that flag by hand as roles age. Within the emphasized roles, the first is visually marked `current` (accent glow + badge) and the second `recent` (violet dot) — these are positional (index-based), not content-driven, so reordering `en.ts`'s `experience` array changes which role gets which treatment. An `ExperienceEntry` with `totalDuration` set (e.g. Inatel) renders as a grouped sub-list under one company header instead of flat sibling cards.
- `src/components/Credentials.tsx` — merged Education + Certifications into one card (not separate sections) after design review found separate near-empty cards added chrome without content.
- `src/components/Stats.tsx` — the "years of experience / companies / roles held / certifications" strip under the hero. All four numbers are derived at render time from `en.ts` (date parsing + array lengths), never hand-entered — keep it that way when editing content so the strip can't drift out of sync.
- `src/components/Reveal.tsx` / `src/lib/motion.ts` — shared scroll-reveal wrapper and eased-transition constant used across components; add new animated sections through `Reveal` rather than hand-rolling `motion.div` variants.
- `public/resume.pdf` — the downloadable resume; it's a straight copy of the LinkedIn PDF export, not generated from `en.ts`. Replace this file directly to change the download.

### `server/`

- `src/health/` — `GET /health` for container/deploy healthchecks.
- `src/auth/` — the single Admin account. `AuthService` seeds it from `ADMIN_EMAIL`/`ADMIN_PASSWORD` on first boot only (`OnModuleInit`, skipped if an Admin already exists — those env vars aren't re-applied after that). `POST /auth/login` returns a JWT (`JWT_EXPIRES_IN_SECONDS`, a number of seconds — not a duration string; `@nestjs/jwt`'s `expiresIn` treats a numeric *string* as milliseconds but a numeric *type* as seconds, so this must stay `Number(...)`-converted). `AuthModule` exports `PassportModule` (pre-`.register()`'d with the `'jwt'` strategy) so other modules get `JwtAuthGuard` support by importing `AuthModule` — don't re-register `PassportModule` elsewhere, it won't provide the DI token other modules need.
- `src/blog/` — the Blog. `BlogController` deliberately declares the admin routes (`/posts/admin`, `/posts/admin/:id`, all `@UseGuards(JwtAuthGuard)`) before the public routes (`/posts`, `/posts/:slug`) — keep that order, Nest matches routes top-down. `BlogService.update()` sets `publishedAt` when `published` flips to `true` and clears it back to `null` when it flips to `false` (see the Post/Admin definitions in `CONTEXT.md`).
- No admin UI yet — the Blog is API-only for now (curl/Postman), by design; see [ADR 0003](./docs/adr/0003-mariadb-typeorm-backend-datastore.md).

## Deployment

Single DigitalOcean droplet (Ubuntu 22.04, domain `alisonrafael.me` already pointed at it), Dockerized. Three services now run behind the shared reverse proxy:

- `web-client/Dockerfile` — multi-stage: builds with Node, serves the static `dist/` via nginx (`web-client/nginx.conf`). Publicly reachable at `alisonrafael.me` / `www.alisonrafael.me`.
- `server/Dockerfile` — multi-stage: builds the NestJS app with Node, runs the compiled `dist/main.js`. Build context is the **repo root**, not `server/` (`docker build -f server/Dockerfile .`), because npm workspaces hoist the lockfile and `node_modules` there. Publicly reachable at `api.alisonrafael.me`.
- `mariadb` (root `docker-compose.yml`) — not on the `nginx-proxy` network, only on the `internal` one shared with `api`; never publicly reachable.
- `docker-compose.yml` (root) — all three services. `web` and `api` join the external `nginx-proxy` network and set `VIRTUAL_HOST`/`LETSENCRYPT_HOST` for cert/routing auto-discovery; `api` and `mariadb` also share an `internal` network for DB traffic. Reads deploy-time secrets (DB credentials, JWT secret, admin seed) from a `.env` file next to `docker-compose.yml` on the droplet — see root `.env.example` for the shape (distinct from `server/.env.example`, which is for running the API locally without Docker). That `.env` is never hand-edited on the droplet: see below, `deploy.yml` regenerates it from GitHub Actions secrets on every deploy.
- `deploy/proxy/` — the shared `nginx-proxy` + `acme-companion` reverse-proxy stack, deployed **once** on the droplet, independent of any single app's lifecycle. See `deploy/proxy/README.md` and [ADR 0001](./docs/adr/0001-nginx-proxy-acme-companion-for-tls.md) for why this shape was chosen over hand-rolled nginx+certbot or a single-container Caddy setup.
- `.github/workflows/deploy.yml` — on push to `main`: builds and pushes both images to GHCR, then scp's `docker-compose.yml` to the droplet (the repo itself isn't cloned there, so this is the only way that file stays current), SSHes in to write `.env` from GitHub Actions repo secrets, and runs `docker compose pull && up -d`. Needs these repo secrets configured (Settings → Secrets and variables → Actions) before it can run: `DROPLET_HOST`, `DROPLET_USER`, `DROPLET_SSH_KEY`, `DROPLET_APP_DIR` (existing, from the v1 deploy) plus `DB_ROOT_PASSWORD`, `DB_PASSWORD`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (new, for the backend).

## Working process

This project's scope was defined through a structured "grilling" interview (see conversation history) rather than freeform requirements — before adding features or changing architecture, check `CONTEXT.md` and `docs/adr/` first; they record *why* decisions were made, not just what exists.
