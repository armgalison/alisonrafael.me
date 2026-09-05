# Reverse proxy (one-time droplet setup)

This stack (`nginx-proxy` + `acme-companion`, per [ADR 0001](../../docs/adr/0001-nginx-proxy-acme-companion-for-tls.md)) is infrastructure shared by every app on the droplet, including the v2 backend planned for later. It is deployed once and lives independently of any single app's repo/deploy lifecycle.

## Setup

```bash
docker network create nginx-proxy   # no-op if it already exists
cd deploy/proxy
docker compose up -d
```

## Adding a new app behind it

Give the app's container `VIRTUAL_HOST` and `LETSENCRYPT_HOST` environment variables (see this repo's root `docker-compose.yml` for the pattern) and connect it to the external `nginx-proxy` network. No changes to this stack or its config are needed.
