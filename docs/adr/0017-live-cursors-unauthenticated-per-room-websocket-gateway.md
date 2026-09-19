# Live Cursors: an unauthenticated, ephemeral, per-room WebSocket gateway

**Status:** accepted, implemented.

Live Cursors (see `CONTEXT.md`) — an anonymous mouse-position arrow broadcast in real time to
every other Visitor on the same public page — are the first WebSocket/real-time infrastructure
anywhere in this stack. Nothing in `server/` or `web-client/` talked over a persistent connection
before this.

**Decision:** `server/src/live-cursors/` is a single `LiveCursorsGateway` built on
`@nestjs/websockets` + `@nestjs/platform-socket.io`, using Socket.IO's built-in rooms
(`home`, `blog`, `post:<slug>`, set once at handshake time from a client-supplied query
param — never guessed server-side, never changed mid-connection) rather than raw `ws` or a
separate service. `@nestjs/platform-socket.io` peers cleanly on this stack's `@nestjs/common
^12.0.1` — worth stating explicitly, since a reader who remembers [ADR 0009](./0009-reader-comments-pre-moderated-pseudonymous-one-level-rate-limited.md)
rejecting `@nestjs/throttler` over a peer-version conflict might reasonably wonder why a second
`@nestjs/*` package was accepted here; there's no such conflict this time.

The gateway is deliberately unauthenticated — no `JwtAuthGuard`, no `AuthModule` import — and
excluded from `/admin/*` entirely, since a Live Cursor carries no identity worth protecting.
Abuse is bounded instead by a hand-rolled ~20-events/second per-connection throttle inlined in
the gateway, adapting the same in-memory, dependency-free, fixed-window pattern
`CommentRateLimitGuard` (ADR 0009) uses for HTTP, to a WebSocket message handler instead of a
guard (there's no `canActivate` hook for socket events — excess events are just dropped, not
queued, and not rejected with an error).

All state — room membership, per-connection color, last-known position — lives only in the
gateway's own process memory, never MariaDB: a Live Cursor's entire existence is scoped to one
connection's lifetime, so there is nothing meaningful to persist, and a restart clearing every
room is fine (the same "tolerate rather than engineer against" call [ADR 0010](./0010-view-counter-intentionally-undeduplicated.md)
already made for the view counter).

Socket.IO's CORS is separate machinery from Express's `app.enableCors` — `@WebSocketGateway`'s
decorator config is static and runs before Nest's DI is available, so `main.ts` reuses the same
`CORS_ORIGIN`-derived allow-list through a small custom `IoAdapter`
(`live-cursors.io-adapter.ts`) applied via `app.useWebSocketAdapter(...)`, rather than a second,
independently-maintained origin list.

## Consequences

- This sets real precedent as the first realtime feature: the `api` container's single process
  now holds one more long-lived connection type sharing its event loop with every HTTP
  request/response — a future realtime feature gets a working pattern to copy (gateway shape,
  in-memory throttle, custom CORS adapter), but also one more thing competing for that loop.
- Choosing per-page rooms and zero identity over a global room or an authenticated presence layer
  was a deliberate scope cut: Live Cursors can never be attributed to a Visitor, a session, or
  even themselves across a reconnect, so no "who is this" or "who's online" feature can ever be
  layered on top of this data without a breaking redesign.
- Touch/mobile Visitors get no functionality from this at all — the client never opens the socket
  on a coarse-pointer device (see `LiveCursorOverlay.tsx`). Accepted, given the site's primary
  Visitor (`CONTEXT.md`) is a recruiter skimming on desktop.
- No new `docker-compose.yml` or `deploy/proxy/vhost.d/` entry was needed: Socket.IO runs on the
  same NestJS HTTP server/port already fronted by `VIRTUAL_HOST: api.alisonrafael.me`, and
  `nginxproxy/nginx-proxy`'s template sends unconditional `Upgrade`/`Connection` headers for every
  proxied location already — WebSocket upgrade support was not something to opt into.

## Considered Options

- **Raw `ws` instead of Socket.IO**: rejected — Socket.IO's built-in room primitives
  (`client.join(room)`, `client.to(room).emit(...)` for except-sender broadcast) map directly onto
  the three-room model with zero hand-rolled membership tracking; raw `ws` would need a
  hand-rolled `Map<room, Set<WebSocket>>` plus a hand-rolled message envelope for no real benefit
  on a low-traffic personal site.
- **A single global room instead of per-page rooms**: rejected during design — a Live Cursor's
  position only means something relative to the content the sending Visitor is actually looking
  at; a cross-page global room would put a post reader's arrow over an unrelated resume section
  for anyone elsewhere on the site.
- **Requiring a session/identity so cursors could be attributed to a returning Visitor**:
  rejected — this site has exactly one identity system (`Admin`, JWT-based), and extending any
  form of identity to anonymous Visitors for a cosmetic feature would be a disproportionate new
  surface, both in code and in privacy posture.
