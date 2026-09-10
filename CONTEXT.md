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
The authoring UI for the Admin — routes under `/admin/*` inside `web-client` (not a separate app/deploy). Lets the Admin log in, manage their password, and create/edit/publish Posts with a markdown editor. Not reachable by a Visitor without the Admin's credentials, and it doesn't render public Blog reading pages — that's a separate concern, the Blog reading UI (see [ADR 0005](./docs/adr/0005-admin-panel-in-web-client.md)).
_Avoid_: Dashboard, CMS — this codebase's term is Admin Panel.

**Blog reading UI**:
The Visitor-facing counterpart to the Admin Panel: `/blog` (a list of published Posts) and `/blog/:slug` (one Post's full reading view), also routes inside `web-client` (`src/blog/`), reading `server`'s public `/posts` routes. Like the Admin Panel, it's route-split and lazy-loaded from the main resume bundle — in this case so `react-markdown` (rendering a Post's markdown `content`) doesn't ship to every Visitor, only those who actually open `/blog*`.
_Avoid_: Blog frontend, public blog — this codebase's term is Blog reading UI (distinguishing it from the Admin-only authoring UI, the Admin Panel).

**Post**:
A single Blog article: title, unique `slug`, excerpt, content, and a `published` flag. Drafts (`published: false`) are visible only via the admin-only `/posts/admin*` routes; publishing sets `publishedAt` and makes the Post visible via the public `/posts` routes. Unpublishing clears `publishedAt` again rather than preserving the original publish date.
_Avoid_: Article, entry — this codebase's term is Post (matches the `Post` entity and `/posts` routes).

**Blog**:
The content type this Admin manages: a list of Posts, publicly readable, admin-write-only. Not a separate app — it's a resource inside the v2 API, authored through the Admin Panel.

**Upload**:
An image file the Admin embeds in a Post's markdown `content`, added by dragging/pasting it into the Admin Panel's editor. Stored as a plain file on the droplet's own disk (not object storage — see [ADR 0004](./docs/adr/0004-local-disk-image-storage.md)), referenced by URL from the Post text. Deleting a Post or removing an image from its content does **not** delete the Upload — orphaned files are an accepted, unaddressed cost at this scale, not a bug.
_Avoid_: Asset, media, attachment — this codebase's term is Upload.

**Trend**:
A candidate blog topic — a topic and a one-line summary, plus (once ranked) a relevance rationale — that a Trend Search surfaces. Deliberately light: no deep write-up at this stage. A Trend only gets a full agent-written text (synthesized, not a scraped source article) once the Admin selects it to turn into a Post (see [ADR 0007](./docs/adr/0007-anthropic-api-for-trend-discovery.md)).
_Avoid_: Article, topic (bare), suggestion — Trend is this project's term for a not-yet-a-Post candidate.

**Trend Search**:
One run of "Get top trends": Claude searches the web for what's currently drawing attention in software development, then ranks that list against the Tech Stack, producing up to 10 Trends. Unlike a bare Trend, a Trend Search *is* persisted (one row per run, see ADR 0007's persistence addendum) — specifically so opening `/admin/trends` shows the last run's results for free, and a fresh (paid) search only happens when the Admin presses "New search." The Admin Panel only ever shows the single most recent Trend Search; older ones stay in the table but aren't browsable from the UI today.
_Avoid_: Discovery, search results (bare) — Trend Search is this project's term for one saved run.

**Tech Stack**:
Alison's own professional skill list — the `technologyGroups` shown in the public Skills section (`en.ts`, sourced from the `shared/` workspace) — used to judge which Trends are worth writing about. This is his career-wide toolbox (includes things like Angular, AWS, Kubernetes from past roles), **not** this repository's own implementation stack, which is a different, narrower list documented in `CLAUDE.md`'s Stack section.
_Avoid_: "my stack" / "the stack" unqualified — always say Tech Stack (career-wide) vs. this repo's own stack when the distinction matters.
