# Build context is the repo root (npm workspaces: the lockfile and
# hoisted node_modules live at the root, not under server/). Also needs
# the shared/ workspace built alongside it — see ADR 0008.
#   docker build -f server/Dockerfile .

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/package.json
COPY server/package.json ./server/package.json
RUN npm ci
COPY shared ./shared
COPY server ./server
RUN npm run build --workspace=shared
RUN npm run build --workspace=server

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/package.json
COPY server/package.json ./server/package.json
RUN npm ci --omit=dev
COPY --from=build /app/shared/dist ./shared/dist
COPY --from=build /app/server/dist ./server/dist
EXPOSE 3000
CMD ["node", "server/dist/main.js"]
