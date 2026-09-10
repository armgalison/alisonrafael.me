# Reader comments: pre-moderated, pseudonymous, one level deep, rate-limited

The Blog gains reader comments. Four decisions were made together, all trading capability
and openness for a small operator's ability to keep the surface safe with near-zero
infrastructure:

**Pre-moderation, not post-hoc removal or none.** Every Comment is created `pending` and
is invisible on the public Post until the Admin sets it `approved` from the Comments page
(`/admin/comments`); the Admin can also `reject` or delete. There is exactly one Admin,
volume is expected to be low, and it is cheaper to gate a handful of comments than to
watch a live feed and clean up after abuse. With no email capability in the server (and
none being added), the notification channel is a pending-count badge in the Admin Panel
nav — not a push of any kind.

**Pseudonymous identity.** A Comment carries a required `authorName` and an optional
`authorEmail`. There are no reader accounts and no third-party sign-in. `authorEmail` is
stored for the Admin's eyes only: it is never returned by a public endpoint and never
shown in the Blog reading UI, and the column is declared `select: false` at the TypeORM
level so a public query cannot leak it even by mistake — the admin list endpoint
re-selects it explicitly.

**Exactly one level of threading**, enforced server-side: a reply targets a top-level
Comment, and a `POST` whose `parentId` points at a Comment that itself has a parent (or at
a Comment on a different Post) is rejected. This keeps both rendering and moderation
trivial — no recursive trees, no depth limits to reason about.

**Rate limiting is the only spam control.** A small in-process fixed-window guard
(`CommentRateLimitGuard`, ~30 lines, no new dependency) is applied with `@UseGuards(...)`
on the single public comment-create route — not as a global `APP_GUARD` — matching the
codebase's existing per-route `@UseGuards` convention and keeping the blast radius to one
endpoint. `@nestjs/throttler` was the first choice but its 6.x line still caps its
`@nestjs/common` peer at v11 while the rest of the stack is on v12, so it cannot be
installed without forcing peer resolution; a hand-rolled guard (in the spirit of the
codebase's other small hand-rolled helpers) avoids that and is trivially enough for one
route. The limit is 5 submissions per IP per hour, hardcoded constants (no env var, no
deploy-config change); the window map is pruned opportunistically so it can't grow
unbounded. It relies on the `trust proxy` already set in `main.ts` for a correct client IP
behind nginx-proxy. Trade-off accepted: the counter is per-process and resets on restart —
fine for a single low-traffic container.

This also introduces the **first real relations in the schema**: `Comment → Post`
(`@ManyToOne`, `onDelete: 'CASCADE'`) and a self-referencing `Comment → parent`
(`@ManyToOne`, `onDelete: 'CASCADE'`). Nothing else in the schema uses `@ManyToOne` /
`@OneToMany` today. Per [ADR 0003](./0003-mariadb-typeorm-backend-datastore.md) this is
still acceptable under `synchronize: true` because `comments` is a brand-new table with no
data to protect — but it moves the schema closer to the point where real migrations are
warranted; revisit before comment data is at stake.

## Considered Options

- No moderation (comments appear immediately): rejected — an unauthenticated, unmoderated
  write endpoint on a personal site is a spam magnet with no one watching it.
- Honeypot field: rejected for now — `forbidNonWhitelisted` on the global `ValidationPipe`
  already 400s any undeclared field, and rate limiting covers the automated-flood case;
  can be added later if needed.
- CAPTCHA: rejected — a third-party script/embed and a UX tax for a feature this small.
- A third-party embed (Disqus and similar): rejected — hands reader data and page weight
  to an external service, and clashes with the site's no-tracking, self-contained stance.
- A global `APP_GUARD` throttler with `@SkipThrottle` elsewhere: rejected — larger blast
  radius than the one route that needs it, and no other route wants throttling today.
- `@nestjs/throttler`: rejected for now — 6.x's peer range stops at `@nestjs/common` v11
  and this stack is on v12, so it won't install without forcing peer resolution; not worth
  that for one route's worth of rate limiting. Revisit if throttling is ever wanted in
  more than one place.
