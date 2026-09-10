# Admin session: JWT in localStorage, no refresh token

The Admin Panel stores its JWT in `localStorage` and lets it simply expire (`JWT_EXPIRES_IN_SECONDS`, currently 24h), sending the Admin back to `/admin/login` — there's no refresh-token flow and no httpOnly-cookie storage. Both were deliberate choices, not defaults reached for without thought. `localStorage` over an httpOnly cookie: the Admin Panel never renders third-party or visitor-supplied content (no comments, no external input echoed back), so the XSS surface a stolen-from-`localStorage` token would need is low, and a cookie would have required CORS `credentials` and CSRF protection for a security gain that doesn't clearly apply here. No refresh token: this is one person logging in occasionally to write a Post, not a session that needs to stay alive indefinitely — re-entering credentials once a day is an acceptable cost against the added complexity (and attack surface) a refresh-token flow brings.

## Considered Options

- httpOnly cookie session: rejected — the CSRF-protection cost doesn't buy a corresponding XSS-risk reduction for this app's actual attack surface.
- Refresh tokens: rejected — added complexity for a session-longevity problem this single-user, occasional-use tool doesn't really have.
