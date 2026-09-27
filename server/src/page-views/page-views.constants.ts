import { resolve } from 'node:path';

// How long a Page View (and so a Visitor's IP) is kept — ADR 0019. The
// public footer notice states this number; change both together.
export const PAGE_VIEW_RETENTION_DAYS = 90;

// Relative to process.cwd() like UPLOADS_DIR: /app/geoip in the image,
// where server/Dockerfile puts the DB-IP Lite databases fetched by
// server/scripts/fetch-geoip.sh. Missing files just mean no enrichment.
export const GEOIP_DIR = resolve('./geoip');
export const GEOIP_COUNTRY_DB = 'dbip-country-lite.mmdb';
export const GEOIP_ASN_DB = 'dbip-asn-lite.mmdb';

// Max Page Views recorded per client IP per window. Generous — a Visitor
// clicking through the Blog is a handful a minute — it only stops a loop
// or a script from filling the table.
export const PAGE_VIEW_MAX_PER_WINDOW = 60;
export const PAGE_VIEW_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
