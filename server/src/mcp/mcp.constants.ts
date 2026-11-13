// The Admin MCP (ADR 0021): a read-only MCP endpoint plus the OAuth 2.1
// authorization server that guards it, both inside this API.

// Where the API is reachable from outside: the OAuth issuer, and the base
// of every URL the discovery metadata advertises. Defaults to production;
// set API_PUBLIC_URL (e.g. http://localhost:3000) to run it locally.
export const API_PUBLIC_URL_DEFAULT = 'https://api.alisonrafael.me';

export const MCP_PATH = '/mcp';

// The only scope there is: the Admin MCP never changes anything.
export const MCP_SCOPE = 'mcp:read';

export const MCP_ACCESS_TOKEN_TTL_SECONDS = 60 * 60; // 1 hour
// Sliding: every refresh rotates the token and restarts the 30 days, so a
// client in use stays connected and an idle one has to log in again.
export const MCP_REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
export const MCP_AUTHORIZATION_CODE_TTL_SECONDS = 5 * 60;

// Prefixes make a leaked token recognizable in a log or a paste.
export const MCP_ACCESS_TOKEN_PREFIX = 'mcpat_';
export const MCP_REFRESH_TOKEN_PREFIX = 'mcprt_';

// Dynamic Client Registration accepts only these redirect URIs: claude.ai's
// connector callback, and loopback on any port (Claude Code and other
// native clients, RFC 8252). Anything else could phish the login page.
export const MCP_ALLOWED_REDIRECT_URIS = [
  'https://claude.ai/api/mcp/auth_callback',
  'https://claude.com/api/mcp/auth_callback',
];
export const MCP_LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

// Registered clients that never completed a login are deleted after this.
export const MCP_UNUSED_CLIENT_TTL_MS = 24 * 60 * 60 * 1000;

// Only refresh a Connected client's "last used" once a minute, not on
// every tool call.
export const MCP_LAST_USED_RESOLUTION_MS = 60 * 1000;
