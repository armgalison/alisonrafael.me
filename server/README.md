# server

The NestJS API behind `api.alisonrafael.me` — auth, posts, comments, uploads, the résumé profile, the
AI tools, and the Live Cursors WebSocket gateway.

This package is one part of a monorepo; setup, architecture, environment variables, deployment and the
decisions behind all of it are in the **[root README](../README.md)**. The module-by-module map lives
in [`CLAUDE.md`](../CLAUDE.md), and the reasoning in [`docs/adr/`](../docs/adr).

```bash
npm run dev:api      # from the repo root — watch mode on :3000 (needs MariaDB and server/.env)
```
