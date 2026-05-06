# Frontend image — builds the SPA with Vite, then ships it with Caddy.
# Single image so the same container both serves the assets and reverse-
# proxies /api to the backend (see deploy/Caddyfile).

# ---------- Stage 1: build the SPA ----------
FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Bring in everything the Vite build needs. shared/ provides @shared/api types
# pulled by src/api/*.
COPY index.html ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY postcss.config.js ./
COPY tailwind.config.ts ./
COPY components.json ./
COPY public ./public
COPY src ./src
COPY shared ./shared

RUN npm run build

# ---------- Stage 2: Caddy with the built assets baked in ----------
FROM caddy:2-alpine

COPY --from=builder /app/dist /srv/dist
COPY deploy/Caddyfile /etc/caddy/Caddyfile

EXPOSE 80 443
