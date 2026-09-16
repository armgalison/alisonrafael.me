import { join, resolve } from 'node:path';
import { UPLOADS_DIR } from '../uploads/uploads.constants.js';

// Same cwd-relative convention as UPLOADS_DIR: `npm run dev:api` runs with
// cwd already at server/, while server/Dockerfile's CMD runs from the repo
// root (/app) — so this resolves to server/assets/resume-seed.pdf locally
// and /app/assets/resume-seed.pdf in the container, where the Dockerfile
// copies server/assets to ./assets to match.
export const RESUME_SEED_PATH = resolve('./assets/resume-seed.pdf');

// Fixed filename on the persistent uploads volume — always overwritten on
// approval, so the public download URL never changes and there's no old
// file to garbage-collect.
export const RESUME_PDF_PATH = join(UPLOADS_DIR, 'resume.pdf');
