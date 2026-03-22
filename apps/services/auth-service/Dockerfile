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
COPY apps/services/auth-service/package.json apps/services/auth-service/
RUN pnpm install --frozen-lockfile --filter @promptforge/auth-service...

# ─── Builder ──────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY packages/ packages/
COPY apps/services/auth-service/ apps/services/auth-service/
RUN pnpm --filter @promptforge/database db:generate
RUN pnpm --filter @promptforge/auth-service build

# ─── Production ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/services/auth-service/dist ./dist
COPY --from=builder /app/packages/database/generated ./packages/database/generated
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4001
CMD ["node", "dist/main"]

# ─── Development ──────────────────────────────────────────────────────────────
FROM deps AS development
COPY packages/ packages/
COPY apps/services/auth-service/ apps/services/auth-service/
WORKDIR /app/apps/services/auth-service
EXPOSE 4001
CMD ["pnpm", "dev"]
