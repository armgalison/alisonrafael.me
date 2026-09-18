# Serve the Blog at blog.alisonrafael.me

**Status:** accepted, implemented.

The Blog reading UI (`/blog`, `/blog/:slug`) has, since [ADR 0013](./0013-migrate-web-client-to-nextjs-app-router.md),
been just a route tree inside the single `web-client` Next.js app, served at
`alisonrafael.me/blog`. The want is to give the Blog its own subdomain,
`blog.alisonrafael.me`.

**Decision:** keep ADR 0013's single-app model — the Blog stays the same Next.js route tree in
the same `web` container, with no new deployable, no new CI job, and no new secret. Reachability
under the new hostname is entirely an infra + `src/proxy.ts` change:

- `docker-compose.yml`'s `web` service gets a third hostname —
  `VIRTUAL_HOST`/`LETSENCRYPT_HOST: alisonrafael.me,www.alisonrafael.me,blog.alisonrafael.me` —
  proven safe by the fact `web` already answers on two hosts this way. `nginx-proxy` +
  `acme-companion` ([ADR 0001](./0001-nginx-proxy-acme-companion-for-tls.md)) auto-issue the TLS
  cert for the new host with no other change to that stack (see `deploy/proxy/README.md`).
- `src/proxy.ts` (already doing host-based `www` → apex redirects) gains two more branches: a
  request on `blog.alisonrafael.me` is `NextResponse.rewrite`n internally to `/blog${pathname}`
  (asset-looking paths — anything with a `.` — are left alone so `public/` files keep resolving);
  a request for `/blog` or `/blog/*` on the apex or `www` host gets a 308 redirect to the
  equivalent path on `blog.alisonrafael.me`.
- The subdomain's URL shape is host-root: `blog.alisonrafael.me/` is the post list,
  `blog.alisonrafael.me/:slug` is a post — not `blog.alisonrafael.me/blog/:slug`, which would be
  a redundant repeat of "blog" already carried by the host. This is why the rewrite above is a
  path-prefixing rewrite rather than a 1:1 passthrough.
- Old `alisonrafael.me/blog*` links permanently redirect rather than staying live in parallel —
  one canonical URL per post, no duplicate-content ambiguity for search engines or the Share
  buttons.
- `api.alisonrafael.me`'s CORS allow-list (`docker-compose.yml`'s `CORS_ORIGIN`, and
  `server/src/main.ts`'s local-dev default) gains `https://blog.alisonrafael.me`, since Comments
  and view-registration are genuine browser-side fetches to the API, not server-side ones.

## Consequences

- Choosing the clean host-root URL shape over keeping the `/blog` prefix has a real cost: since
  the rewrite always re-adds `/blog` internally, any in-page link within the Blog route tree that
  still hardcodes a `/blog`-prefixed path would double up and 404 when clicked from the
  subdomain. `web-client/src/blog/routes.ts` (`blogPathPrefix`/`blogListPath`/`blogPostPath`,
  each reading the request `Host` header via `next/headers`) exists specifically to keep
  in-page navigation correct under both the subdomain (browser path has no `/blog`) and local dev
  at `localhost:5173/blog` (real path, still `/blog`-prefixed, since the rewrite only fires when
  `Host` is literally `blog.alisonrafael.me`). `web-client/src/blog/url.ts` holds the
  counterpart pure, host-agnostic public-URL builders (`blogPostUrl`, `blogListUrl`) for
  canonical/OG tags and Share links — kept in a separate module from `routes.ts` because it also
  needs to be importable from Client Components (`ShareButtons.tsx`, `Nav.tsx`), and `routes.ts`
  pulls in `next/headers`, which can't be part of a Client Component's module graph.
- `Nav.tsx`'s active-route logic (`isBlog`/`isHome`) could no longer rely on `usePathname()`
  alone: on `blog.alisonrafael.me` the browser-visible pathname for the post list is bare `/`
  (the `/blog` prefix is server-side-only), which would otherwise misreport the Blog list page as
  "home" and wrongly run the resume-only section-scroll tracking. `blog/layout.tsx` now passes an
  explicit `section="blog"` prop that `Nav` prefers over path-sniffing.
- The Nav's "Blog" link is a plain cross-origin `<a>` rather than `next/link`'s
  client-side-routed `<Link>`, since it now targets a different host entirely.

## Considered Options

- **A fully separate app/container for the Blog** (its own `VIRTUAL_HOST`, its own image, its own
  deploy step — the same shape `api.alisonrafael.me` already has): rejected — contradicts ADR
  0013's decision to keep the resume, Admin Panel, and Blog as one app, and would mean
  duplicating the shared chrome (`Nav`/`Footer`, resume-content fetch in `blog/layout.tsx`) or
  cutting the Blog off from it, for no benefit tied to the actual ask (a different hostname).
- **Keep `/blog` as the path prefix on the subdomain too**
  (`blog.alisonrafael.me/blog/:slug`): simpler to implement (a 1:1 rewrite, no host-aware
  internal-link helper needed) but redundant given the host already says "blog" — rejected in
  favor of the cleaner host-root shape, accepting the added `routes.ts`/`url.ts` complexity as
  the direct cost of that choice.
- **Leave `alisonrafael.me/blog*` reachable alongside the subdomain (no redirect)**: rejected —
  two live URLs for the same content is worse for SEO (ambiguous canonical) and for the Share
  buttons than a single 308 redirect.
