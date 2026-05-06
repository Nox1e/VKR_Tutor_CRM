# Backend image — Node 20 on Debian (bookworm-slim).
#
# We stay on glibc rather than Alpine because Prisma's query engine binary
# is happier with glibc — see ADR-002 / spec §12 in memory-bank/specs.

# ---------- Stage 1: install deps + generate Prisma client ----------
FROM node:20-bookworm-slim AS builder

WORKDIR /app/backend

RUN apt-get update -qq \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy manifests + prisma schema first so we can cache npm ci across source
# changes. The prisma generate step needs schema.prisma at install time.
COPY backend/package.json backend/package-lock.json ./
COPY backend/prisma ./prisma

# Skip postinstall (which runs `prisma generate` against a partial layout)
# and run it explicitly once everything is in place.
RUN npm ci --ignore-scripts \
    && npx prisma generate

# ---------- Stage 2: runtime ----------
FROM node:20-bookworm-slim AS runtime

WORKDIR /app/backend

RUN apt-get update -qq \
    && apt-get install -y --no-install-recommends openssl ca-certificates dumb-init \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    PORT=4000

# All prod + dev deps come along — Prisma's CLI lives in devDependencies but is
# called at container start (`prisma migrate deploy`). The image is ~250MB
# either way, not worth a second-stage trim.
COPY --from=builder /app/backend/node_modules ./node_modules
COPY backend/server.js ./server.js
COPY backend/src ./src
COPY backend/scripts ./scripts
COPY backend/prisma ./prisma

# `shared/` lives one level up (../../../shared) — keep that on disk so the
# admin service's import path resolves.
COPY shared /app/shared

EXPOSE 4000

# dumb-init reaps zombies and forwards SIGTERM cleanly. The shell wrapper
# applies migrations once on boot and only then exec's the server.
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "npx prisma migrate deploy && exec node server.js"]
