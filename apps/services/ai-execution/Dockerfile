FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/tsconfig/package.json packages/tsconfig/
COPY packages/types/package.json packages/types/
COPY apps/services/ai-execution/package.json apps/services/ai-execution/
RUN pnpm install --frozen-lockfile --filter @promptforge/ai-execution...

FROM deps AS builder
COPY packages/ packages/
COPY apps/services/ai-execution/ apps/services/ai-execution/
RUN pnpm --filter @promptforge/ai-execution build

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/services/ai-execution/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 4003
CMD ["node", "dist/main"]

FROM deps AS development
COPY packages/ packages/
COPY apps/services/ai-execution/ apps/services/ai-execution/
WORKDIR /app/apps/services/ai-execution
EXPOSE 4003
CMD ["pnpm", "dev"]
