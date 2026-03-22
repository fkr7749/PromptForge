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
COPY apps/frontend/package.json apps/frontend/
RUN pnpm install --frozen-lockfile --filter @promptforge/frontend...

# ─── Builder ──────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY packages/ packages/
COPY apps/frontend/ apps/frontend/
# Generate Prisma client for the database package
RUN pnpm --filter @promptforge/database db:generate
# Build the Next.js app (outputs to apps/frontend/.next/standalone via output: 'standalone')
RUN pnpm --filter @promptforge/frontend build

# ─── Runner ───────────────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nextjs

# Copy standalone output — this is the minimal self-contained server bundle
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
# Copy static assets (standalone server does not bundle these)
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/static ./apps/frontend/.next/static
# Copy public directory
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/public ./apps/frontend/public

USER nextjs
EXPOSE 3000
# The standalone server entrypoint produced by Next.js
CMD ["node", "apps/frontend/server.js"]

# ─── Development ──────────────────────────────────────────────────────────────
FROM deps AS development
COPY packages/ packages/
COPY apps/frontend/ apps/frontend/
WORKDIR /app/apps/frontend
EXPOSE 3000
CMD ["pnpm", "dev"]
