# Admin MCP: one remote endpoint in `server`, with its own OAuth and opaque, revocable tokens

The Admin wants to query the Access Log and recent Chat Conversations from claude.ai (web and
mobile) as well as Claude Code. claude.ai only connects to a remote MCP server over HTTPS, and
only through OAuth, so the Admin MCP is a single remote, read-only, stateless Streamable HTTP
endpoint at `api.alisonrafael.me/mcp`. It is a module inside the existing `server` app and
calls `PageViewsService`/`ChatService` directly. Claude Code uses the same endpoint. `server`
also acts as its own OAuth 2.1 authorization server: authorization code + PKCE + refresh only,
with metadata discovery and Dynamic Client Registration, and `redirect_uri` limited to
claude.ai's callback and loopback addresses. The login and consent page is plain HTML served
by `server` and checks the existing Admin credentials. Tokens are opaque random strings stored
hashed in MariaDB and checked on every call. Access tokens last 1h; refresh tokens last
30 days and rotate on every use. Tokens are scoped to the Admin MCP, so `/mcp` rejects the
Admin Panel's JWT and every other admin route rejects an MCP token.

This departs from ADR 0006 on purpose, and only for the Admin MCP. A connector that asks for
the password every day is unusable, OAuth clients refresh tokens on their own, and revoking
a client has to work right away. The Admin Panel keeps its 24h JWT with no refresh.

## Considered Options

- Local `stdio` server for Claude Code: rejected. claude.ai can't reach it, and running it
  next to the remote endpoint would double the code and the auth model.
- Separate `mcp` workspace/container calling the REST API: rejected. It would add a fourth
  service, a subdomain and a deploy step to serve read-only data `server` already holds.
- External IdP (Auth0, WorkOS, Clerk, Cloudflare Access): rejected. It would bring in a third
  party, an account and a secret to protect one user whose password `server` already checks.
- Reusing the Admin Panel JWT: rejected. A token held by an AI client could then call
  write routes, and "read-only" would hold only at the tool layer.
- JWT access tokens: rejected. Revoking one would leave it working for up to 1h, and it
  would need a new signing secret.
- Fully open DCR: rejected. Any `redirect_uri` makes phishing the consent page possible.

## Consequences

- Revocation: Settings → Connected clients lists every grant (client, date, last use) and
  revokes it immediately. Changing the Admin password revokes every grant.
- The Admin password now unlocks a 30-day grant, so the OAuth login and `POST /auth/login`
  share one per-IP failed-login rate limit.
- The Admin MCP's responses, full Visitor IPs and Chat Conversation transcripts included,
  enter the AI client's context and so reach Anthropic. This was accepted: it is the same data
  the Admin Panel shows, read by the same Admin (see ADR 0019).
