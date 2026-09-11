import type { NextConfig } from 'next'
import path from 'node:path'

const nextConfig: NextConfig = {
  // Deployed as a standalone Node container (ADR 0013) — replaces the nginx
  // container that used to serve the static Vite build.
  output: 'standalone',
  // This is an npm-workspaces monorepo (web-client depends on the `shared`
  // workspace — ADR 0008); without this, Next's standalone-output file
  // tracing can miss files outside web-client/ itself.
  outputFileTracingRoot: path.join(__dirname, '..'),
}

export default nextConfig
