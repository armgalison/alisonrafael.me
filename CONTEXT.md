# Resume Site

Alison Rafael Marinho Gonçalves's personal site: a resume/CV presentation sourced from his LinkedIn export, aimed at recruiters and hiring managers.

## Language

**Resume Site**:
The whole project. A single-subject site presenting one person's career history, skills, and certifications, sourced from a LinkedIn export.
_Avoid_: Portfolio — implies project case studies/screenshots, which this project does not include.

**Visitor**:
Anyone viewing the site. Primarily a recruiter or hiring manager doing a fast skim before or during a hiring process.
_Avoid_: User, client, candidate (candidate refers to Alison himself, the subject of the resume, not the visitor).

**v1 / v2**:
Versioning shorthand for build scope, not maturity. v1 is the static resume site (no backend) — complete and deployed. v2 is the backend service now being built: a NestJS API (`server/`) behind `api.alisonrafael.me`, backed by MariaDB, adding admin auth and the Blog.
_Avoid_: MVP — v1 was the complete first release, not a stripped-down placeholder.

**Admin**:
The single account (Alison himself) authorized to manage Blog content via the API. Exactly one exists; it's seeded once from `ADMIN_EMAIL`/`ADMIN_PASSWORD` on first boot and never re-seeded. Authenticates via `POST /auth/login` to get a JWT. Can change their own password (with current-password confirmation) from the Admin Panel; email is not changeable through the product — it stays whatever `ADMIN_EMAIL` seeded.
_Avoid_: User — there is no multi-user account system, just this one operator.

**Admin Panel**:
The authoring UI for the Admin — routes under `/admin/*` inside `web-client` (not a separate app/deploy). Lets the Admin log in, manage their password, and create/edit/publish Posts with a markdown editor. Not reachable by a Visitor without the Admin's credentials, and it doesn't render public Blog reading pages — that's a separate, not-yet-built concern (see [ADR 0005](./docs/adr/0005-admin-panel-in-web-client.md)).
_Avoid_: Dashboard, CMS — this codebase's term is Admin Panel.

**Post**:
A single Blog article: title, unique `slug`, excerpt, content, and a `published` flag. Drafts (`published: false`) are visible only via the admin-only `/posts/admin*` routes; publishing sets `publishedAt` and makes the Post visible via the public `/posts` routes. Unpublishing clears `publishedAt` again rather than preserving the original publish date.
_Avoid_: Article, entry — this codebase's term is Post (matches the `Post` entity and `/posts` routes).

**Blog**:
The content type this Admin manages: a list of Posts, publicly readable, admin-write-only. Not a separate app — it's a resource inside the v2 API, authored through the Admin Panel.

**Upload**:
An image file the Admin embeds in a Post's markdown `content`, added by dragging/pasting it into the Admin Panel's editor. Stored as a plain file on the droplet's own disk (not object storage — see [ADR 0004](./docs/adr/0004-local-disk-image-storage.md)), referenced by URL from the Post text. Deleting a Post or removing an image from its content does **not** delete the Upload — orphaned files are an accepted, unaddressed cost at this scale, not a bug.
_Avoid_: Asset, media, attachment — this codebase's term is Upload.
