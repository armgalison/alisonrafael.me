# Admin Panel lives inside web-client, not a separate app

The Admin Panel (`/admin/*` — login, password change, Post authoring) is built as routes inside the existing `web-client` React app, sharing its build, Dockerfile, and deploy — not a separate app on its own subdomain (e.g. `admin.alisonrafael.me`) or its own container. `web-client`'s router was already structured to carry future pages, and a separate app would mean a fourth Docker image, a fourth `VIRTUAL_HOST`, and a second frontend build/deploy pipeline for a UI only one person (Alison) ever uses. The one real cost: the Admin Panel's dependencies (notably the markdown editor) ship in the same web-client codebase as the public resume page, so the build must route-split/lazy-load `/admin/*` to keep those dependencies out of the public page's JS bundle — the public resume site's load performance must not regress because of admin tooling nobody else visits.

## Considered Options

- Separate app/subdomain (`admin.alisonrafael.me`, its own container): rejected — adds a whole second deploy pipeline for a single-user internal tool; not justified at this scale.
