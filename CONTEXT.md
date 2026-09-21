# Resume Site

Alison Rafael Marinho Gonçalves's personal site: a resume/CV presentation sourced from his LinkedIn export, aimed at recruiters and hiring managers.

## Language

**Resume Site**:
The whole project. A single-subject site presenting one person's career history, skills, and certifications, sourced from a LinkedIn export.
_Avoid_: Portfolio — implies project case studies/screenshots, which this project does not include.

**Visitor**:
Anyone viewing the site. Primarily a recruiter or hiring manager doing a fast skim before or during a hiring process.
_Avoid_: User, client, candidate (candidate refers to Alison himself, the subject of the resume, not the visitor).

**Live Cursor**:
An ephemeral, anonymous mouse-position indicator broadcast over WebSocket to every other Visitor currently on the same public page. Tied 1:1 to one WebSocket connection's lifetime — created the instant a client connects, removed the instant that connection disconnects — with no auth, no persistence, and no identity linkage back to a Visitor: two browser tabs from the same person are two independent Live Cursors with no way to correlate them, and that's intentional. Scoped to exactly one room (`home`, `blog`, or `post:<slug>`) for its entire lifetime, visible only to other Live Cursors in that same room, and never present on `/admin/*`. See [ADR 0017](./docs/adr/0017-live-cursors-unauthenticated-per-room-websocket-gateway.md).
_Avoid_: Presence, live viewer, cursor share — this codebase's term is Live Cursor, and it only ever carries a position, never a viewer count or "who's online" concept.

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
The Visitor-facing counterpart to the Admin Panel: `/blog` (a list of published Posts) and `/blog/:slug` (one Post's full reading view), routes inside `web-client`'s Next.js app (`src/app/blog/`), reading `server`'s public `/posts` routes. Server-rendered — the post list and a post's content are fetched and rendered on the server per request, not loaded client-side after an empty shell — with the comment form, share buttons, and view-count registration as client-side islands within that server-rendered page (see [ADR 0013](./docs/adr/0013-migrate-web-client-to-nextjs-app-router.md)).
_Avoid_: Blog frontend, public blog — this codebase's term is Blog reading UI (distinguishing it from the Admin-only authoring UI, the Admin Panel).

**Post**:
A single Blog article: title, unique `slug`, excerpt, content, a `published` flag, an optional Cover image, a View count, and zero or more Comments. Drafts (`published: false`) are visible only via the admin-only `/posts/admin*` routes; publishing sets `publishedAt` and makes the Post visible via the public `/posts` routes. Unpublishing clears `publishedAt` again rather than preserving the original publish date.
_Avoid_: Article, entry — this codebase's term is Post (matches the `Post` entity and `/posts` routes).

**Blog**:
The content type this Admin manages: a list of Posts, publicly readable, admin-write-only. Not a separate app — it's a resource inside the v2 API, authored through the Admin Panel.

**Upload**:
An image file the Admin embeds in a Post's markdown `content`, added by dragging/pasting it into the Admin Panel's editor. Stored as a plain file on the droplet's own disk (not object storage — see [ADR 0004](./docs/adr/0004-local-disk-image-storage.md)), referenced by URL from the Post text. A Post's Cover image is uploaded through the same `POST /uploads` endpoint but is a first-class Post field rather than inline `content`. Deleting a Post, removing an image from its content, or replacing a Cover image does **not** delete the Upload — orphaned files are an accepted, unaddressed cost at this scale, not a bug.
_Avoid_: Asset, media, attachment — this codebase's term is Upload.

**Cover image**:
An optional image URL (`coverImageUrl`) on a Post, uploaded through the same `POST /uploads` endpoint as an inline Upload, shown as the lead visual on the Blog reading UI's listing cards. A distinct singular Post field, not one of the Post's inline `content` Uploads. A Post without one falls back to a placeholder card.
_Avoid_: Thumbnail, hero image, banner — this codebase's term is Cover image.

**View count**:
A single integer per Post (`viewCount`) incremented once on every load of that Post's reading page, via an explicit `POST /posts/:slug/views` fired from the Blog reading UI. Deliberately **not** de-duplicated by Visitor or IP, and deliberately **not** a side effect of `GET /posts/:slug` (which stays idempotent). Refresh-inflation is a known, accepted inaccuracy (see [ADR 0010](./docs/adr/0010-view-counter-intentionally-undeduplicated.md)).
_Avoid_: Unique views, analytics, visits — it is a raw, intentionally naive counter.

**Comment**:
A reader-submitted plain-text note on a Post: a required display name (`authorName`), an optional private `authorEmail` (stored for the Admin only — never returned on a public endpoint, never shown in the Blog reading UI), a body rendered as plain text with newlines preserved (no markdown, no HTML), and a moderation status. Threading is exactly one level: a Comment may reply to a top-level Comment, but a reply cannot itself be replied to.
_Avoid_: Comment thread, discussion — this codebase's term is Comment; "thread" overstates a one-level model.

**Comment moderation**:
The lifecycle of a Comment's status: `pending` → `approved` → (optionally) `rejected`. Every Comment is created `pending` and is invisible on the public Post until the Admin sets it `approved` from the Comments page. The Admin can also set it `rejected` or delete it outright. There is no auto-approval (see [ADR 0009](./docs/adr/0009-reader-comments-pre-moderated-pseudonymous-one-level-rate-limited.md)).
_Avoid_: Spam queue, review, flag — the states are exactly pending / approved / rejected.

**Comments page**:
The Admin Panel route (`/admin/comments`) for moderating Comments: filter by status, see the otherwise-hidden `authorEmail`, and approve / reject / delete. A pending-count badge in the Admin Panel nav links here; there is no email notification (the server has no email capability).
_Avoid_: Moderation dashboard — this codebase's term is Comments page.

**Share buttons**:
A row of controls at the foot of a Post's reading view that hand the Post's canonical URL (`https://alisonrafael.me/blog/<slug>`) to LinkedIn, Facebook, or X's share dialog, plus a copy-link action and — on devices that support it — the native share sheet. No Instagram button (Instagram has no link-share URL, so copy-link covers that case) and no click tracking, consistent with the project's no-visitor-analytics stance.
_Avoid_: Social widgets, share bar — this codebase's term is Share buttons.

**Link preview**:
The title / description / image card a social network renders when a Post URL is shared. Produced server-side, per Post, by `/blog/:slug`'s `generateMetadata` (title, excerpt as the description, Cover image, canonical URL) — a real network crawler reads this straight out of the server-rendered response, no client JavaScript involved (see [ADR 0013](./docs/adr/0013-migrate-web-client-to-nextjs-app-router.md), which replaced an earlier attempt at this — [ADR 0011](./docs/adr/0011-per-post-link-previews-via-server-rendered-blog-html.md) — that only injected `<head>` tags into an otherwise still-client-rendered SPA shell). Every route without its own per-post metadata (the resume, the `/blog` list) still falls back to the site-wide tags on the root layout.
_Avoid_: OG card, social card, rich preview — this codebase's term is Link preview.

**Trend**:
A candidate blog topic — a topic and a one-line summary, plus (once ranked) a relevance rationale — that a Trend Search surfaces. Deliberately light: no deep write-up at this stage. A Trend only gets a full agent-written text (synthesized, not a scraped source article) once the Admin selects it to turn into a Post (see [ADR 0007](./docs/adr/0007-anthropic-api-for-trend-discovery.md)).
_Avoid_: Article, topic (bare), suggestion — Trend is this project's term for a not-yet-a-Post candidate.

**Trend Search**:
One run of "Get top trends": Claude searches the web for what's currently drawing attention in software development, then ranks that list against the Tech Stack, producing up to 10 Trends. Unlike a bare Trend, a Trend Search *is* persisted (one row per run, see ADR 0007's persistence addendum) — specifically so opening `/admin/tools/trends` shows the last run's results for free, and a fresh (paid) search only happens when the Admin presses "New search." The Admin Panel only ever shows the single most recent Trend Search; older ones stay in the table but aren't browsable from the UI today.
_Avoid_: Discovery, search results (bare) — Trend Search is this project's term for one saved run.

**Tech Stack**:
Alison's own professional skill list — the `technologyGroups` shown in the public Skills section (`en.ts`, sourced from the `shared/` workspace) — used to judge which Trends are worth writing about. This is his career-wide toolbox (includes things like Angular, AWS, Kubernetes from past roles), **not** this repository's own implementation stack, which is a different, narrower list documented in `CLAUDE.md`'s Stack section.
_Avoid_: "my stack" / "the stack" unqualified — always say Tech Stack (career-wide) vs. this repo's own stack when the distinction matters.

**Tools**:
The Admin Panel section (`/admin/tools`) holding personal utilities the Admin builds for themselves — distinct from the Blog's authoring pages. Three tools live here: the Cover Letter Generator, Get Top Trends (formerly linked directly from the Posts page, moved here since it's also a personal utility rather than Blog-authoring itself), and the ATS Resume Generator. The section is deliberately a small directory so more can be added without restructuring the nav.
_Avoid_: Utilities, dashboard widgets — this codebase's term is Tools, matching the nav label and route.

**Cover Letter Generator**:
The first Tool: the Admin pastes a job description and Claude writes a cover letter grounded in the Resume Profile (see below), returned synchronously (one Claude call, no `web_search`, no streaming — unlike Trends). Ephemeral by design — nothing is persisted, matching this codebase's bias toward only storing a Claude response when there's a concrete reason to avoid re-paying for it (there isn't one here; see ADR 0008's resume-facts addendum).
_Avoid_: Cover letter writer, application assistant — this codebase's term is Cover Letter Generator.

**ATS Resume Generator**:
A Tool that, given a job description (pasted by the Admin, same input shape as the Cover Letter Generator), drafts a resume from the live Resume Profile, formatted in plain Markdown for Applicant Tracking System (ATS) parsing (standard section headers, bullet points, no tables/images/columns). The job description is used only to decide what to emphasize, reorder, and phrase toward — Claude is explicitly instructed never to add, imply, or invent any employer, title, skill, achievement, or date beyond what the Resume Profile actually contains. Unlike the Cover Letter Generator, this one *is* persisted (one `AtsResume` row per draft, carrying both the generated `markdown` and the `jobDescription` it was tailored to — see `server/src/ats-resume/`) and has an explicit Approve step: the Admin reviews/edits the generated markdown in the same editor used for Blog Posts, and approving renders it to PDF server-side and publishes it as the file the public "Download Resume" links serve — replacing the old git-committed static `resume.pdf` (see [ADR 0014](./docs/adr/0014-ats-resume-generator-replaces-static-download.md)).
_Avoid_: Resume builder, CV generator — this codebase's term is ATS Resume Generator, matching the nav label and the "ATS" framing (optimized for parsing, not visual design).

**Resume Profile**:
The subset of resume content both apps need: name, headline, location, top skills, the Tech Stack, experience, education, certifications, languages. DB-backed and Admin-editable — a single row (`server/src/resume-profile/`, `ResumeProfileEntity.data`, seeded once from `shared/`'s static `resumeProfile` default) edited as raw JSON from the Admin Panel's Settings page, not a source file the Admin has to hand-edit and redeploy (see [ADR 0015](./docs/adr/0015-resume-profile-becomes-db-backed-and-editable.md)). `server`'s Cover Letter Generator and ATS Resume Generator both fetch the live row via `ResumeProfileService.get()` rather than importing the static default, and the public resume page fetches it too (cached until the Admin's next save, via Next.js on-demand tag revalidation), so an edit reaches every consumer without a code change or rebuild. Purely UI copy (nav labels, hero text, section titles, contact details, footer) stays local to `web-client`'s `en.ts` (now typed `StaticResumeContent`) — only the resume *facts* are Resume Profile.
_Avoid_: Resume data, resume content (bare) — Resume Profile is this project's term for the specific editable subset, not the whole `ResumeContent` type (which also holds `web-client`-only UI copy).

**Dev Agent**:
An AI helper (and the orchestrator that coordinates them) that helps *build and maintain* this repository — planning, implementing, testing, reviewing, keeping docs current. It only ever acts during development, on Alison's behalf; it is never deployed and never part of what a Visitor or the Admin uses. Distinct from the Claude calls inside the product itself (Trend discovery, the Tech-Stack filter, the draft writer, the Cover Letter and ATS Resume Generators), which are product features.
_Avoid_: Agent (bare) — reserved for the Claude calls inside the product; say Dev Agent when you mean the development-time helpers.

**Human gate**:
An action a Dev Agent must never take on its own and must leave to Alison's explicit go-ahead, every time and with no exception for the orchestrator: `git commit`, `git push`, creating an issue, opening a PR, merging, and anything touching deploys or secrets (a merge to `main` deploys straight to production). Everything short of that — reading, editing files, running build/lint/tests, writing a review report — a Dev Agent may do freely. A review Dev Agent runs *before* Alison reviews and only produces a short report; it never approves or blocks anything itself.
_Avoid_: Approval step, sign-off — this codebase's term is Human gate. (Not to be confused with the ATS Resume Generator's Approve step, which is a product feature the Admin performs.)
