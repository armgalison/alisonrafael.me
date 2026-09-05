# Use nginx-proxy + acme-companion for reverse proxy and TLS

The site is deployed as Docker containers on a single DigitalOcean droplet, and a v2 backend service is already planned to join the same droplet later. We chose `nginx-proxy` + `acme-companion` over a hand-maintained `nginx.conf` + standalone certbot: both are themselves Dockerized and auto-discover any container via its `VIRTUAL_HOST`/`LETSENCRYPT_HOST` environment variables, so adding the v2 backend later means adding env vars to its container, not hand-editing nginx config and re-running certbot for a new host/route. The trade-off is less direct control over the nginx config than hand-rolling it, accepted because the growth path (more containers behind the same proxy) was already known at decision time.

## Considered Options

- Hand-written `nginx.conf` + standalone certbot container: rejected — requires manual config edits and cert re-issuance for every new service added behind the proxy.
- Caddy (single container, built-in automatic HTTPS): rejected — simplest option for one static site, but doesn't fit multiple independently-deployed containers behind one reverse proxy as cleanly as `nginx-proxy` does.
