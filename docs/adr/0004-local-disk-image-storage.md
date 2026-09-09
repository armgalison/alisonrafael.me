# Store post images on the droplet's local disk, not object storage

Uploads (images embedded in Post markdown via the Admin Panel's editor) are saved as plain files on the droplet's own disk, in a Docker named volume mounted into the `api` container, and served back out by the API itself — not pushed to S3/DigitalOcean Spaces or similar. This is a deliberate choice for a single-admin, low-volume personal blog: no extra service to provision, pay for, or hold credentials for, and the droplet already has more than enough disk for the realistic number of images one person will post. The trade-off, accepted knowingly: no CDN/edge caching, no automatic backup of uploads beyond whatever backs up the droplet itself, and migrating to object storage later means writing a one-time migration script to move existing files and rewrite their URLs.

## Considered Options

- DigitalOcean Spaces / S3-compatible object storage: rejected for now — adds a second service with its own credentials and cost for a problem the droplet's disk already solves at this scale; revisit if upload volume or reliability needs grow.
