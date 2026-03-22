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
COPY apps/services/analytics/package.json apps/services/analytics/
RUN pnpm install --frozen-lockfile --filter @promptforge/analytics...

# ─── Builder ──────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY packages/ packages/
COPY apps/services/analytics/ apps/services/analytics/
RUN pnpm --filter @promptforge/database db:generate
RUN pnpm --filter @promptforge/analytics build

# ─── Production ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app
ENV NODE_ENV=production

# Run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs node

COPY --from=builder --chown=node:nodejs /app/apps/services/analytics/dist ./dist
COPY --from=builder --chown=node:nodejs /app/packages/database/generated ./packages/database/generated
COPY --from=builder --chown=node:nodejs /app/node_modules ./node_modules

USER node
EXPOSE 4006
CMD ["node", "dist/main"]

# ─── Development ──────────────────────────────────────────────────────────────
FROM deps AS development
COPY packages/ packages/
COPY apps/services/analytics/ apps/services/analytics/
WORKDIR /app/apps/services/analytics
EXPOSE 4006
CMD ["pnpm", "dev"]
