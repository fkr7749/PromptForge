# ─── Base ─────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app

# ─── Dependencies ─────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/tsconfig/package.json packages/tsconfig/
COPY packages/types/package.json packages/types/
COPY packages/database/package.json packages/database/
COPY apps/services/search-service/package.json apps/services/search-service/
RUN pnpm install --frozen-lockfile --filter @promptforge/search-service...

# ─── Builder ──────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY packages/ packages/
COPY apps/services/search-service/ apps/services/search-service/
RUN pnpm --filter @promptforge/database db:generate
RUN pnpm --filter @promptforge/search-service build

# ─── Production ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app
ENV NODE_ENV=production

# Run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs node

COPY --from=builder --chown=node:nodejs /app/apps/services/search-service/dist ./dist
COPY --from=builder --chown=node:nodejs /app/packages/database/generated ./packages/database/generated
COPY --from=builder --chown=node:nodejs /app/node_modules ./node_modules

USER node
EXPOSE 4005
CMD ["node", "dist/main"]

# ─── Development ──────────────────────────────────────────────────────────────
FROM deps AS development
COPY packages/ packages/
COPY apps/services/search-service/ apps/services/search-service/
WORKDIR /app/apps/services/search-service
EXPOSE 4005
CMD ["pnpm", "dev"]
