# Use npm workspaces for the web-client/server monorepo

Adding the v2 backend meant choosing between independent projects (separate `package.json`/lockfile/CI per app, each cloned or referenced separately) and a monorepo. We chose an npm workspaces monorepo: one root `package.json` lists `web-client` and `server` as workspaces, with a single root lockfile and hoisted `node_modules`. This was a deliberate choice over independent projects, made when restructuring for the backend — the two apps ship together (same repo, same deploy), so one lockfile and one `npm install` outweighed the isolation independent projects would have given.

The trade-off: `server`'s Docker build must use the **repo root** as its build context (`docker build -f server/Dockerfile .`), not `server/` itself, since the lockfile and hoisted deps live at the root. `web-client` was originally left with its own `package-lock.json` and a self-contained build context, so it wouldn't depend on the workspace root at all — that held only as long as `web-client` had no cross-workspace dependency of its own. [ADR 0008](./0008-shared-workspace-for-cross-app-data.md) introduces one (a `shared/` workspace), which ended that independence: `web-client` now builds from the repo root too, the same way `server` always has.

## Considered Options

- Independent projects (separate lockfiles, no workspace root): rejected — would mean juggling two `npm install` runs and two lockfiles for two apps that always deploy together.
- Also considered nrwl/Nx or Turborepo: rejected as overkill for two apps with no shared internal packages between them yet.
