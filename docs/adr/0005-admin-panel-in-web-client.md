# Admin Panel lives inside web-client, not a separate app

The Admin Panel (`/admin/*` — login, password change, Post authoring) is built as routes inside the existing `web-client` React app, sharing its build, Dockerfile, and deploy — not a separate app on its own subdomain (e.g. `admin.alisonrafael.me`) or its own container. `web-client`'s router was already structured to carry future pages, and a separate app would mean a fourth Docker image, a fourth `VIRTUAL_HOST`, and a second frontend build/deploy pipeline for a UI only one person (Alison) ever uses. The one real cost: the Admin Panel's dependencies (notably the markdown editor) ship in the same web-client codebase as the public resume page, so the build must route-split/lazy-load `/admin/*` to keep those dependencies out of the public page's JS bundle — the public resume site's load performance must not regress because of admin tooling nobody else visits.

## Considered Options

- Separate app/subdomain (`admin.alisonrafael.me`, its own container): rejected — adds a whole second deploy pipeline for a single-user internal tool; not justified at this scale.

## Update: the Blog reading UI reuses the same lazy-load pattern

The public Blog reading UI (`/blog`, `/blog/:slug` — see `CONTEXT.md`) is also routes inside `web-client` (`src/blog/`), not a separate app, for the same reasoning as above. It carries its own bundle cost — `react-markdown`, to render a Post's markdown `content` — so `App.tsx` lazy-loads `BlogRoutes` exactly like `AdminRoutes`, keeping `react-markdown` out of the main resume bundle and loading it only when a Visitor actually navigates to `/blog*`.

## Update: the mechanism changes under Next.js, the decision doesn't

[ADR 0013](./0013-migrate-web-client-to-nextjs-app-router.md) migrates `web-client` to Next.js (App Router). The manual `React.lazy`/`Suspense` route-splitting described above becomes obsolete — Next.js code-splits per route automatically, so there's no longer a hand-rolled mechanism to name. But the *decision* this ADR actually records — the Admin Panel lives inside the same app/build/deploy as the public site, not a separate app or container — is unchanged and remains the operative reasoning; Next.js's App Router just gives it router-native code-splitting instead of a manual `lazy()` call.
