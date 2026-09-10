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

**Rate limiting is the only spam control.** `@nestjs/throttler` (a new server dependency)
is applied with `@UseGuards(ThrottlerGuard)` on the single public comment-create route —
not as a global `APP_GUARD` — matching the codebase's existing per-route `@UseGuards`
convention and keeping the blast radius to one endpoint. The limit is 5 submissions per IP
per hour, a hardcoded constant (no env var, no deploy-config change). It relies on the
`trust proxy` already set in `main.ts` for a correct client IP behind nginx-proxy.

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
