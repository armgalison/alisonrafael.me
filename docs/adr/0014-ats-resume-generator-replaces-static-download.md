# ATS Resume Generator replaces the git-committed static resume.pdf download

The site's public "Download Resume" links used to point at `web-client/public/resume.pdf`, a
LinkedIn export copy replaced by hand and baked into the `web-client` Docker image at build
time. A new Admin Tool (the ATS Resume Generator, under `/admin/tools/ats-resume`) now drafts
an ATS-optimized resume in Markdown from `resumeProfile` via Claude, shows it in the same
markdown editor used for Blog Posts for the Admin to review/edit, and — on explicit approval —
renders it to PDF server-side and writes it to `server`'s persistent Uploads volume (same
volume/reasoning as [ADR 0004](./0004-local-disk-image-storage.md)), fixed at
`resume.pdf` so the public URL never changes. The public download links (`Hero.tsx`, `Nav.tsx`)
now point at `GET /resume` (a public, unguarded route) instead of the old same-origin static
file, since `web-client`'s `public/` directory can't be written to at runtime and have it
survive a redeploy — every push to `main` rebuilds and replaces that container's image, wiping
any runtime change.

On first boot, if no resume has ever been approved yet, `AtsResumeService` seeds the persistent
volume from a bundled default PDF (`server/assets/resume-seed.pdf`, a checked-in copy of the
last static export) — mirroring `AuthService`'s existing seed-once-on-boot pattern for the
Admin account — so the download link is never broken while the Admin gets around to generating
and approving the first AI-written version.

PDF rendering happens server-side via `pdfkit`, with a small hand-rolled Markdown-to-PDF
renderer rather than a general markdown-to-PDF pipeline: the Claude system prompt already
constrains the generated resume to the handful of constructs an ATS parser cares about
(headings, bullet lists, plain paragraphs — no tables/images/columns), so the renderer only
ever needs to handle that fixed subset.

## Considered Options

- Client-side PDF generation (reusing the Cover Letter Generator's `jsPDF` approach), uploading
  the resulting binary to the server on approve: rejected — the Approve action becomes a plain
  JSON call server-side instead, and centralizes the ATS-format layout logic in one place
  rather than duplicating comparable layout code in the browser.
- Headless-browser rendering (e.g. Puppeteer, markdown → HTML → PDF): rejected — a new, heavy
  dependency for a document that's deliberately plain (no rich styling) by ATS-format design;
  `pdfkit`'s direct drawing API is a better fit and far lighter.
- No boot-time seed — just accept the download link is broken until the Admin approves a resume
  once: rejected — a few extra lines mirroring an already-established pattern
  (`AuthService.onModuleInit`) fully avoids a dead public link with negligible cost.
- A second, dedicated Docker volume for the generated resume rather than the existing Uploads
  volume: rejected — reusing `uploads-data` needs zero `docker-compose.yml`/infra changes and
  the resume is just one more static file `ServeStaticModule` already serves out of that
  directory.
