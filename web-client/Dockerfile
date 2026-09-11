# Build context is the repo root — needed since web-client depends on the
# shared/ workspace too (see ADR 0008), not just its own directory anymore.
#   docker build -f web-client/Dockerfile .

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/package.json
COPY web-client/package.json ./web-client/package.json
RUN npm ci
COPY shared ./shared
COPY web-client ./web-client
RUN npm run build --workspace=shared
RUN npm run build --workspace=web-client

# output: 'standalone' (next.config.ts) traces only the files each route
# actually needs, but its build does NOT copy .next/static or public/ into
# the standalone tree — Next's own docs call this out explicitly, so both
# are copied by hand below, alongside the app's own subdirectory shape
# under outputFileTracingRoot (the monorepo root — see next.config.ts):
#   .next/standalone/node_modules/      (hoisted to the repo root)
#   .next/standalone/web-client/server.js
#   .next/standalone/web-client/.next/  (no static/ — copied in below)
FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/web-client/.next/standalone ./
COPY --from=build /app/web-client/.next/static ./web-client/.next/static
COPY --from=build /app/web-client/public ./web-client/public
EXPOSE 3000
CMD ["node", "web-client/server.js"]
