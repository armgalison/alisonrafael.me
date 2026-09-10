import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Relative to process.cwd() — server/Dockerfile's CMD runs from the repo
// root (/app), so this resolves to /app/uploads in production, where
// docker-compose mounts a persistent volume. Overridable for local dev.
export const UPLOADS_DIR = resolve(process.env.UPLOADS_DIR ?? './uploads');
export const UPLOADS_ROUTE = '/uploads';

mkdirSync(UPLOADS_DIR, { recursive: true });

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
