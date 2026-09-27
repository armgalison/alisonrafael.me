# Access Log stores full Visitor IPs for 90 days, captured by a first-party beacon

This reverses the project's earlier "no visitor analytics" position (README, and ADR 0010's
rejection of storing IPs as a privacy cost). The Admin wants two things the View count can't
give: traffic insight across the whole public site, and the signal that a specific company
looked at the resume. The second needs the full IP (enriched with its network/organization),
so a truncated or hashed IP is not enough.

We record one Page View per browser page load of a public page (resume and Blog, including
client-side navigation) through a client-side beacon that posts to the API. The API reads the
IP from the request (`trust proxy`), enriches it at write time from the offline DB-IP Lite
country + ASN databases baked into the image, and stores it in MariaDB. Rows older than 90
days are deleted. The site footer states that page visits are logged, IP included, for 90
days. ADR 0010's View count is unchanged and stays independent.

## Considered Options

- nginx-proxy access logs: rejected — lives in the separately deployed proxy stack, and
  records every bot and scanner request.
- Server-side capture in `proxy.ts`: rejected — sees prefetches, RSC requests and crawlers
  that would need header/User-Agent filtering, and adds an API call to every page request.
- Truncated or daily-salted-hash IPs: rejected — they defeat the "which company looked"
  use case, which is half the reason this exists.
- External IP lookup APIs (ip-api, ipinfo): rejected — they send Visitor IPs to a third
  party and are rate-limited.
- A hosted analytics product: rejected, as in ADR 0010.

## Consequences

- The beacon endpoint is unauthenticated, so Page Views can be forged. As with the View
  count, that is accepted, and it is limited by a public-route whitelist for `path`, taking
  the host from `Origin`/`Referer`, and a hard-coded per-IP rate limit.
- The Admin's own visits are excluded only where the Admin JWT is visible (the apex
  domain's `localStorage`). Admin visits to `blog.` are still recorded.
