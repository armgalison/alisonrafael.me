# Resume Profile moves from a static file to a DB-backed, Admin-editable row

The Resume Profile (name, headline, location, top skills, tech stack, languages, certifications,
experience, education) used to live only as a hand-edited literal object in
`shared/src/resume.ts`, imported statically by `web-client`'s public resume page and by
`server`'s Cover Letter Generator. Any change required editing that file and redeploying both
apps. Since the ATS Resume Generator (see [ADR 0014](./0014-ats-resume-generator-replaces-static-download.md))
now tailors a resume per job description and must never invent facts, keeping the underlying
data current is essential — and hand-editing a source file for that is exactly the kind of
friction that discourages keeping it current.

The Resume Profile now lives in a single DB row (`server/src/resume-profile/`,
`ResumeProfileEntity.data`, a JSON blob — same idiom as `TrendSearch`'s `trends` column, since
nothing here needs to be queried by an individual nested field, only ever loaded/replaced
whole), seeded once from the old static default so the switch was zero-downtime. It's edited
from the Admin Panel's Settings page as raw JSON (not a structured form with per-field inputs
and list editors for nested arrays) and read by `GET /resume-profile` (public — the public site
itself needs it unauthenticated). Both the Cover Letter Generator and the ATS Resume Generator
now call `ResumeProfileService.get()` at request time instead of importing the static default,
so an Admin edit reaches every Claude-facing tool immediately, with no redeploy.

The public resume page (`/`) and the Blog layout (which needs the Admin's name for its footer)
fetch the same row via `fetch(url, { next: { tags: ['resume-profile'] } })` — cached
indefinitely by Next.js's Data Cache until that tag is explicitly revalidated, not on a
time-based guess. The Settings page's Save action calls a same-origin Next.js Route Handler
(`POST /api/revalidate-resume`) which runs `revalidateTag('resume-profile', { expire: 0 })`,
so the very next visit after a save gets fresh content instead of serving one more stale copy.

## Considered Options

- A structured form (per-field inputs, add/remove list editors for `experience`'s nested
  `roles`, `technologyGroups`, etc.) instead of raw JSON: rejected for now — confirmed with the
  Admin, who already hand-edits this exact shape in `shared/src/resume.ts` today, so raw JSON
  isn't a new editing burden, and a full form builder for several levels of nested arrays is a
  lot of UI to build and maintain for a single-admin tool. Revisit if the JSON editing proves
  error-prone in practice.
- Keeping the public resume page static (built once from whatever the Resume Profile was at
  build time, with the DB-backed row only feeding the Admin Tools): rejected — the Admin
  explicitly wants a Settings edit to reach the live site without a redeploy.
- Time-based revalidation (`next.revalidate: <seconds>`) instead of on-demand tag revalidation:
  rejected — an edit is a deliberate, infrequent admin action; the Admin explicitly wants it to
  take effect on save, not wait out a polling window guess.
- `revalidateTag(tag, 'max')` (the profile Next.js recommends for most on-demand-revalidation
  cases) instead of `{ expire: 0 }`: rejected — `'max'` serves one more stale page while
  revalidating in the background, so the very next visitor right after a save would still see
  the old content. That trade only pays off under real traffic volume this personal site
  doesn't have; `{ expire: 0 }` blocks the next request for a fresh fetch instead, which is
  the correctness the Admin actually asked for.
- A dedicated secret/JWT check on `/api/revalidate-resume`: rejected — it only busts a cache
  tag, mutates no data, and exposes nothing sensitive; same low-stakes pragmatism as this
  codebase's plain in-memory comment rate limiter (see
  [ADR 0009](./0009-reader-comments-pre-moderated-pseudonymous-one-level-rate-limited.md)).
