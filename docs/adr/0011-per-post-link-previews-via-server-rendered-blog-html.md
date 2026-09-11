# Per-Post link previews come from server-rendered `/blog/:slug` HTML

**Status:** superseded by [ADR 0013](./0013-migrate-web-client-to-nextjs-app-router.md).

When a Post URL is shared to LinkedIn / Facebook / X, those crawlers fetch the URL and
read `<head>` **without running JavaScript**. Today `web-client` is a static SPA served by
a plain nginx `try_files … /index.html` fallback, so every route — including
`/blog/:slug` — returns one hardcoded `<title>` and `<meta name="description">`. Every
shared Post therefore gets the same generic, imageless card.

The Share buttons feature ships first with client-only pieces (the buttons themselves, a
per-Post `document.title` for humans/bookmarks, and site-wide fallback `og:` / `twitter:`
tags in `index.html`). Rich **per-Post** previews are a separate, infrastructure-level
change, recorded here so the direction is settled rather than re-litigated later.

**Chosen direction:** the `web` container's nginx gains a `location /blog/` that
`proxy_pass`es to a new `server` (NestJS) endpoint. That endpoint returns the built
`index.html` with per-Post tags injected from the Post — `og:title` (title),
`og:description` (excerpt), `og:image` (`coverImageUrl`, or a site default when null),
`og:url` (canonical), `og:type=article`, `twitter:card=summary_large_image`. A real
Visitor gets the correct tags **and** the SPA still boots normally from the same HTML; a
crawler gets what it needs. No User-Agent sniffing.

## Consequences

- It punches a dynamic hole in a deliberately fully-static frontend: `/blog/*` gains a
  proxy hop, and the API must have the frontend's built `index.html` available (a copy
  baked into the `server` image, or a shared volume populated at deploy).
- `server`, which returns only JSON + uploaded files today, takes on rendering one HTML
  document. Kept to string interpolation into the built `index.html` — no view engine.
- The `deploy/proxy` and `web` nginx configs both change, and the two must ship together.
- The canonical host question (`alisonrafael.me` vs `www.`, currently served without a
  redirect) should be resolved as part of this — the injected `og:url` must be stable.

## Considered Options

- **`map $http_user_agent` → a prerender service / OG endpoint for bots only:** rejected.
  Bot UA lists rot, the humans-vs-crawlers split is fragile, and it adds a service to run.
- **Build-time prerender / SSG of Post pages:** rejected. Posts are created and edited in
  the database after the frontend is built; a build-time pass can't see them.
- **Move the whole Blog reading UI to server-side rendering:** rejected as far more than
  the problem needs — the SPA is fine for humans; only `<head>` needs to be server-truth.

## Update: superseded by a full Next.js migration

The rejected "move the whole Blog reading UI to server-side rendering" option above is, in
hindsight, exactly what got chosen — just framed differently: not a bespoke NestJS
`<head>`-injection layer bolted onto the existing SPA, but a full migration of `web-client`
to Next.js (App Router), which does real per-route SSR and `generateMetadata` natively. A
follow-up implementation attempt at *this* ADR's direction (an nginx `location /blog/`
proxied to a NestJS `PreviewModule` that fetched the built `index.html` at runtime and
string-injected tags into it) was built, tested end-to-end, and then abandoned once it
became clear the real want was actual server-rendered content, not just injected `<head>`
tags into an otherwise-empty shell. See [ADR 0013](./0013-migrate-web-client-to-nextjs-app-router.md).
