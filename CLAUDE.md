# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A single-page resume site for Alison Rafael Marinho Gonçalves, sourced from his LinkedIn export. Content, audience, and stack decisions were made deliberately — see [`CONTEXT.md`](./CONTEXT.md) for domain vocabulary and [`docs/adr/`](./docs/adr/) for architectural decisions before changing scope or infrastructure.

Note: `/home/argmalison/projects/alisonrafael.me` (an earlier Angular/NestJS/Mongo attempt at the same site) exists on disk but is abandoned in favor of this project.

## Commands

- `npm run dev` — Vite dev server
- `npm run build` — type-check (`tsc -b`) then production build to `dist/`
- `npm run preview` — serve the production build locally
- `npm run lint` — oxlint

## Stack

Vite + React 19 + TypeScript + React Router + Tailwind CSS v4 (CSS-first config via `@theme` in `src/index.css`, no `tailwind.config.js`) + Framer Motion.

## Architecture

- `src/content/en.ts` — the single source of truth for all resume copy, typed by `src/content/types.ts` (`ResumeContent`). There is no CMS or backend; content changes are code changes to this file.
- `src/i18n/index.ts` — locale registry (`useResumeContent`). Only `en` exists today; adding a language means adding `src/content/<locale>.ts` and registering it here — no i18n library is used, by design (see grilling session record / ADR rationale for keeping v1 dependency-light).
- `src/pages/ResumePage.tsx` — the entire site is one page: `Hero` and `Stats` full-width, then a two-column desktop layout (`Experience` left; a sticky sidebar with `Skills` and `Credentials` right, which stacks below Experience on mobile), then a full-width `Contact` close. `src/App.tsx` still runs everything through React Router (with a `NotFoundPage` catch-all) even though there's only one real route, so routing is already wired for future pages.
- `src/components/Experience.tsx` — roles are split into `emphasized` (shown open) vs. not (collapsed behind "Show earlier roles"), driven by the `emphasized` flag on each entry in `en.ts` rather than a computed date cutoff — update that flag by hand as roles age. Within the emphasized roles, the first is visually marked `current` (accent glow + badge) and the second `recent` (violet dot) — these are positional (index-based), not content-driven, so reordering `en.ts`'s `experience` array changes which role gets which treatment. An `ExperienceEntry` with `totalDuration` set (e.g. Inatel) renders as a grouped sub-list under one company header instead of flat sibling cards.
- `src/components/Credentials.tsx` — merged Education + Certifications into one card (not separate sections) after design review found separate near-empty cards added chrome without content.
- `src/components/Stats.tsx` — the "years of experience / companies / roles held / certifications" strip under the hero. All four numbers are derived at render time from `en.ts` (date parsing + array lengths), never hand-entered — keep it that way when editing content so the strip can't drift out of sync.
- `src/components/Reveal.tsx` / `src/lib/motion.ts` — shared scroll-reveal wrapper and eased-transition constant used across components; add new animated sections through `Reveal` rather than hand-rolling `motion.div` variants.
- `public/resume.pdf` — the downloadable resume; it's a straight copy of the LinkedIn PDF export, not generated from `en.ts`. Replace this file directly to change the download.

## Deployment

Single DigitalOcean droplet (Ubuntu 22.04, domain `alisonrafael.me` already pointed at it), Dockerized:

- `Dockerfile` — multi-stage: builds with Node, serves the static `dist/` via nginx (`nginx.conf`).
- `docker-compose.yml` — this app's service only. Expects an external `nginx-proxy` Docker network (see below) and sets `VIRTUAL_HOST`/`LETSENCRYPT_HOST` for cert/routing auto-discovery.
- `deploy/proxy/` — the shared `nginx-proxy` + `acme-companion` reverse-proxy stack, deployed **once** on the droplet, independent of this app's lifecycle, because a second (v2, backend) service is planned to join it later. See `deploy/proxy/README.md` and [ADR 0001](./docs/adr/0001-nginx-proxy-acme-companion-for-tls.md) for why this shape was chosen over hand-rolled nginx+certbot or a single-container Caddy setup.
- `.github/workflows/deploy.yml` — on push to `main`: builds the image, pushes to GHCR, then SSHes into the droplet to `docker compose pull && up -d`. Needs `DROPLET_HOST`, `DROPLET_USER`, `DROPLET_SSH_KEY`, `DROPLET_APP_DIR` repo secrets configured before it can run.

## Working process

This project's scope was defined through a structured "grilling" interview (see conversation history) rather than freeform requirements — before adding features or changing architecture, check `CONTEXT.md` and `docs/adr/` first; they record *why* decisions were made, not just what exists.
