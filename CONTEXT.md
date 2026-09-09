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
The single account (Alison himself) authorized to manage Blog content via the API. Exactly one exists; it's seeded once from `ADMIN_EMAIL`/`ADMIN_PASSWORD` on first boot and never re-seeded. Authenticates via `POST /auth/login` to get a JWT.
_Avoid_: User — there is no multi-user account system, just this one operator.

**Post**:
A single Blog article: title, unique `slug`, excerpt, content, and a `published` flag. Drafts (`published: false`) are visible only via the admin-only `/posts/admin*` routes; publishing sets `publishedAt` and makes the Post visible via the public `/posts` routes. Unpublishing clears `publishedAt` again rather than preserving the original publish date.
_Avoid_: Article, entry — this codebase's term is Post (matches the `Post` entity and `/posts` routes).

**Blog**:
The content type this Admin manages: a list of Posts, publicly readable, admin-write-only. Not a separate app — it's a resource inside the v2 API, with no dedicated admin UI yet (API-only; see [ADR 0003](./docs/adr/0003-mariadb-typeorm-backend-datastore.md)).
