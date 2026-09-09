# Build context is the repo root (npm workspaces: the lockfile and
# hoisted node_modules live at the root, not under server/).
#   docker build -f server/Dockerfile .

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json ./server/package.json
RUN npm ci
COPY server ./server
RUN npm run build --workspace=server

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY server/package.json ./server/package.json
RUN npm ci --omit=dev
COPY --from=build /app/server/dist ./server/dist
EXPOSE 3000
CMD ["node", "server/dist/main.js"]
