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

FROM nginx:1.27-alpine AS serve
COPY web-client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/web-client/dist /usr/share/nginx/html
EXPOSE 80
