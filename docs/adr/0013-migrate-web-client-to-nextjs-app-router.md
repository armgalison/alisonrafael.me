# Migrate web-client to Next.js (App Router) for real SSR

**Status:** accepted, implemented.

`web-client` is a Vite + React 19 + React Router single-page app: every route, including
the Blog reading UI, is rendered entirely client-side from a static `index.html` shell. A
prior attempt to fix this for link previews only ([ADR 0011](./0011-per-post-link-previews-via-server-rendered-blog-html.md),
plus an abandoned follow-up implementation ADR) bolted a NestJS endpoint onto the existing
SPA that fetched the built `index.html` at runtime and string-injected `og:`/`twitter:`
tags into it. That was built and worked, but it only ever fixed `<head>` — the actual page
content a crawler or a reader with JavaScript disabled sees was still an empty
`<div id="root">`. The real want, on reflection, is genuine server-rendered content with
client hydration — which only exists in a framework built for it.

**Decision:** migrate `web-client` in place to a single Next.js (App Router) application.
It replaces the SPA entirely — the resume (`/`), the Admin Panel (`/admin/*`), and the Blog
reading UI (`/blog/*`) all become routes of this one app — with rendering strategy chosen
per route rather than uniformly: the Blog is real Server Components doing direct,
server-side data fetches with per-post `generateMetadata` (replacing ADR 0011's mechanism
outright), the resume is mostly server-rendered/static, and the Admin Panel stays entirely
client-rendered.

Two things this migration deliberately does **not** change, both worth stating explicitly
since "migrate the frontend" could be read more broadly:

- **`server/` (the NestJS API) is untouched.** Auth, Blog, Comments, Uploads, and Trends
  (ADRs 0001–0010) keep their exact current shape; Next.js is purely a new frontend
  consumer of the same REST API, fetching server-side where that's possible and
  client-side where it isn't. No backend logic moves into Next.js route handlers — that
  would throw away already-shipped, tested, production backend work for no reason tied to
  the actual problem (missing SSR on the frontend).
- **The Admin Panel's auth model is carried over unchanged.** [ADR 0006](./0006-admin-session-model.md)
  keeps the Admin's JWT in `localStorage`, checked and refreshed client-side. Next.js's
  Server Components have no way to see that token, so `/admin/*` cannot become genuinely
  server-rendered or server-protected under this migration — it's reproduced as a
  client-rendered route group with the same client-side redirect-if-unauthenticated gate
  the SPA has today, not redesigned onto cookies/server sessions. That would be a real,
  separate decision (its own ADR) if ever wanted; this migration's job is parity, not a
  security-model change.

Deployment stays self-hosted on the existing single droplet, behind the existing
nginx-proxy + acme-companion reverse proxy ([ADR 0001](./0001-nginx-proxy-acme-companion-for-tls.md)) —
Next.js runs with `output: 'standalone'` in its own Node container, replacing the current
container that just serves nginx-static files. A managed platform (Vercel and similar) was
not chosen: it would mean leaving the single-droplet deployment model this whole project is
built around, for a personal site with no scaling need that model doesn't already meet.

## Consequences

- This is a full frontend rewrite — every route, every component's client/server boundary,
  the whole build and deploy pipeline for `web-client` — not a targeted fix. Accepted
  because the actual goal (real SSR) has no smaller path to it once a static-SPA-plus-API
  architecture is the starting point; the abandoned ADR 0011 implementation was the smaller
  path, and it wasn't enough.
- `react-router-dom` is dropped entirely in favor of App Router's file-based routing;
  `@uiw/react-md-editor` (the Admin Panel's markdown editor) needs explicit
  client-only/no-SSR handling since it touches browser APIs outside of just render time.
- The manual `React.lazy`/`Suspense` route-splitting described in
  [ADR 0005](./0005-admin-panel-in-web-client.md) becomes obsolete — Next.js code-splits
  per route automatically.
- `server/`'s public Blog endpoints (`GET /posts`, `GET /posts/:slug`, `GET
  /posts/:slug/comments`) now serve two kinds of caller with different needs — a Server
  Component fetching once per request, and the Admin Panel's existing client-side polling —
  without any endpoint changes; this was already true of any HTTP API with multiple
  consumers and needed no new work.
- The abandoned preview-mechanism branch (`blog-per-post-previews`, with a NestJS
  `PreviewModule` under `server/src/preview/`) is deleted, not merged — it never reached
  `main`, so there's nothing to revert there, just history to be aware of if that module's
  name resurfaces in old branch references.

## Considered Options

- **Keep the narrower ADR 0011 mechanism (NestJS injects `<head>` tags into the fetched SPA
  shell) and stop there:** rejected — it was built and functionally worked, but it never
  addressed the actual content-is-client-only-rendered problem, only the meta-tag symptom
  of it.
- **SSR only the Blog, leave the resume/Admin Panel on the current Vite SPA (two
  frontends):** rejected — two frontend codebases/build pipelines to maintain for a
  personal site is more ongoing cost than doing one full migration once.
- **Move backend logic into Next.js Route Handlers, retiring the NestJS API:** rejected —
  throws away tested, deployed backend work (auth, Comments moderation and rate limiting,
  Uploads, Trends) that has nothing to do with the frontend-rendering problem this
  migration exists to solve.
- **Vercel or another managed platform:** rejected — leaves the single-droplet deployment
  model (ADR 0001) this project is built around, for capacity/scale this site will never
  need.
