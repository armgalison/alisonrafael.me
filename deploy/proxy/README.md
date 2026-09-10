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

## Updating

Because this stack is independent of the app's own deploy lifecycle (see above), pushing to `main` never touches it — `.github/workflows/deploy.yml` only redeploys `docker-compose.yml`'s services. Picking up changes made here (e.g. the `vhost.d/api.alisonrafael.me` timeout override added per [ADR 0007](../../docs/adr/0007-anthropic-api-for-trend-discovery.md)) means getting this directory's current contents onto the droplet by hand — however this was originally deployed there (`git pull` if it's a checkout, `scp` if it was copied file-by-file) — then re-running `docker compose up -d` from `deploy/proxy` so `nginx-proxy` picks up the new mount.
