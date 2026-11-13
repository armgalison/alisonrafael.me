import type { Response } from 'express';

// The Admin MCP's OAuth login + consent page (ADR 0021): plain HTML served
// by the API itself, so the whole flow stays on one origin with no
// dependency on web-client. The authorization request travels in hidden
// fields and is re-validated on submit (McpOAuthController).

export interface ConsentFields {
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  state?: string;
  resource?: string;
}

export interface ConsentPageOptions {
  clientName: string;
  fields: ConsentFields;
  email?: string;
  error?: string;
}

export const CONSENT_FORM_ACTION = '/oauth/consent';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function redirectHost(uri: string): string {
  try {
    return new URL(uri).host;
  } catch {
    return uri;
  }
}

export function renderConsentPage({ clientName, fields, email, error }: ConsentPageOptions): string {
  const hidden = Object.entries(fields)
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    .map(([name, value]) => `<input type="hidden" name="${name}" value="${escapeHtml(value)}">`)
    .join('\n      ');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Allow access to the Admin MCP</title>
  <style>
    :root { color-scheme: light dark; --ink: #111; --dim: #555; --line: #ccc; --bg: #fff; --err: #b00020; }
    @media (prefers-color-scheme: dark) { :root { --ink: #eee; --dim: #aaa; --line: #444; --bg: #111; --err: #ff6b6b; } }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.5 system-ui, sans-serif; }
    main { max-width: 400px; margin: 10vh auto; padding: 0 16px; }
    h1 { font-size: 20px; margin: 0 0 8px; }
    p { color: var(--dim); margin: 0 0 16px; }
    strong { color: var(--ink); }
    label { display: block; font-size: 13px; margin: 12px 0 4px; }
    input[type=email], input[type=password] { width: 100%; padding: 8px 10px; border: 1px solid var(--line); border-radius: 6px; background: transparent; color: inherit; font: inherit; }
    .error { color: var(--err); }
    .actions { display: flex; gap: 8px; margin-top: 20px; }
    button { flex: 1; padding: 9px; border-radius: 6px; font: inherit; cursor: pointer; border: 1px solid var(--ink); }
    button[value=allow] { background: var(--ink); color: var(--bg); }
    button[value=deny] { background: transparent; color: var(--ink); border-color: var(--line); }
  </style>
</head>
<body>
  <main>
    <h1>Allow access to the Admin MCP?</h1>
    <p><strong>${escapeHtml(clientName)}</strong> wants read-only access to the Access Log (Visitor IPs included) and Chat Conversations. After you allow it, you'll go back to <strong>${escapeHtml(redirectHost(fields.redirect_uri))}</strong>.</p>
    <p>You can revoke it at any time under Settings → Connected clients.</p>
    ${error ? `<p class="error" role="alert">${escapeHtml(error)}</p>` : ''}
    <form method="post" action="${CONSENT_FORM_ACTION}">
      ${hidden}
      <label for="email">Admin email</label>
      <input id="email" name="email" type="email" autocomplete="username" value="${escapeHtml(email ?? '')}">
      <label for="password">Password</label>
      <input id="password" name="password" type="password" autocomplete="current-password">
      <div class="actions">
        <button type="submit" name="action" value="deny" formnovalidate>Deny</button>
        <button type="submit" name="action" value="allow">Allow</button>
      </div>
    </form>
  </main>
</body>
</html>`;
}

export function sendConsentPage(res: Response, options: ConsentPageOptions, status = 200): void {
  res
    .status(status)
    .set({
      'Cache-Control': 'no-store',
      // Never framed: clickjacking the Allow button.
      'X-Frame-Options': 'DENY',
      // No form-action: browsers apply it to the redirect after submit too,
      // which would block the hop back to the client's redirect URI.
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'",
      'Referrer-Policy': 'no-referrer',
    })
    .type('html')
    .send(renderConsentPage(options));
}
