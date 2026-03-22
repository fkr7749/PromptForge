# PromptForge

> **GitHub meets Postman meets Figma — for the age of AI.**

PromptForge is a production-grade prompt engineering platform where developers discover, craft, test, version, and share AI prompts. Built with a Next.js frontend and a microservices backend, it combines a community prompt library, a multi-model playground, an evaluation framework, RAG workspaces, battle arenas, and a developer API into a single cohesive workspace.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Available Scripts](#available-scripts)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Features

### Core Platform
| Feature | Description |
|---|---|
| **Prompt Library** | Discover, fork, upvote, and save community prompts across 9 categories |
| **Playground** | Multi-model execution studio with streaming, compare mode, variables, and history |
| **Versioning** | Full version history with changelogs, diffs, and rollback for every prompt |
| **Battle Arena** | Head-to-head ELO-rated voting tournaments between prompts |
| **Leaderboard** | Real-time ELO rankings across the community |
| **Marketplace** | Buy and sell premium prompts with Stripe integration |
| **Collections** | Curate and share themed prompt bundles |
| **Daily Challenges** | Community prompt engineering challenges with submissions |

### Advanced / Pro Features
| Feature | Description |
|---|---|
| **Eval Harness** | Automated LLM-as-judge evaluation with custom scoring dimensions |
| **Auto-Benchmark** | Run a prompt across all 6 models simultaneously and compare results |
| **Prompt Linter** | Static analysis — detects undefined variables, injection risks, conflicting instructions |
| **Release Workflow** | Draft → Review → Approved → Production promotion pipeline |
| **RAG Workspaces** | Upload documents, chunk them, and query with AI using context retrieval |
| **Dataset Trainer** | Upload CSV/JSON datasets and generate prompt templates from examples |
| **Semantic Search** | pgvector cosine similarity search across the prompt library |
| **Dependency Graph** | Visual fork/version lineage graph for every prompt |
| **Observability** | Execution cost, latency, error rate, and drift detection dashboard |
| **Battle Arena 2.0** | Rubric scoring, vote explanations, anonymous mode, bracket tournaments |

### Developer
- REST API with API key authentication
- Prompt execution API (single, streaming, compare)
- OpenAPI-compatible endpoints

---

## Tech Stack

### Frontend
- **[Next.js 15](https://nextjs.org/)** with Turbopack — App Router, React Server Components
- **[React 19](https://react.dev/)** + TypeScript 5
- **[Tailwind CSS 3](https://tailwindcss.com/)** — custom forge design system
- **[Framer Motion](https://www.framer.com/motion/)** — animations
- **[Zustand](https://zustand-demo.pmnd.rs/)** — client state
- **[TanStack Query](https://tanstack.com/query)** — server state & caching
- **[Radix UI](https://www.radix-ui.com/)** — accessible UI primitives
- **[Lucide React](https://lucide.dev/)** — icon set

### Backend (Microservices)
- **[NestJS 10](https://nestjs.com/)** — 8 TypeScript microservices
- **[FastAPI](https://fastapi.tiangolo.com/)** — Python safety/moderation service
- **[BullMQ](https://bullmq.io/)** — job queues for AI execution
- **[Meilisearch](https://www.meilisearch.com/)** — full-text search

### AI Providers
- **[Groq](https://groq.com/)** — primary inference (LLaMA 3.3 70B, LLaMA 4 Scout, Kimi K2, GPT-OSS)
- **[OpenAI](https://openai.com/)** — embeddings (text-embedding-3-small, optional)
- Anthropic, Google Gemini, Mistral — supported via model abstraction layer

### Data
- **[PostgreSQL 16](https://www.postgresql.org/)** on [Neon](https://neon.tech/) — primary database
- **[Prisma ORM](https://www.prisma.io/)** — schema, migrations, type-safe client
- **[pgvector](https://github.com/pgvector/pgvector)** — 1536-dim vector embeddings for semantic search
- **[pg_trgm](https://www.postgresql.org/docs/current/pgtrgm.html)** — trigram similarity for RAG retrieval
- **[Redis](https://redis.io/)** on [Upstash](https://upstash.com/) — caching and sessions

### Infrastructure
- **[Vercel](https://vercel.com/)** — frontend hosting
- **[Render](https://render.com/)** — backend services (via `render.yaml`)
- **[Docker Compose](https://docs.docker.com/compose/)** — local development orchestration
- **[Turbo](https://turbo.build/)** — monorepo build system
- **[pnpm](https://pnpm.io/)** — fast, disk-efficient package manager

---

## Project Structure

```
PromptForge/
├── apps/
│   ├── frontend/                  # Next.js 15 web application
│   │   ├── src/
│   │   │   ├── app/               # App Router pages & API routes
│   │   │   │   ├── (public)/      # Landing, browse, pricing
│   │   │   │   ├── api/           # 100+ REST API route handlers
│   │   │   │   ├── playground/    # Multi-model execution studio
│   │   │   │   ├── prompt/        # Prompt view, builder, graph
│   │   │   │   ├── battle/        # Battle arena
│   │   │   │   ├── rag/           # RAG workspaces
│   │   │   │   ├── datasets/      # Dataset trainer
│   │   │   │   ├── observability/ # Execution analytics
│   │   │   │   └── dashboard/     # User dashboard
│   │   │   ├── components/        # Reusable React components
│   │   │   │   ├── layout/        # Navigation, footer
│   │   │   │   ├── playground/    # Model cards, output panels
│   │   │   │   ├── prompt/        # Eval, benchmark, lint, release
│   │   │   │   └── ui/            # Design system primitives
│   │   │   ├── lib/               # Utilities, Prisma client, auth helpers
│   │   │   └── store/             # Zustand auth store
│   │   ├── public/                # Static assets and fonts
│   │   └── .env.example           # Environment variable template
│   │
│   └── services/                  # Backend microservices
│       ├── auth-service/          # JWT auth, OAuth (GitHub, Google)
│       ├── ai-execution/          # Model inference, execution queue
│       ├── prompt-service/        # Prompt CRUD and versioning
│       ├── playground/            # Playground session management
│       ├── search-service/        # Meilisearch integration
│       ├── analytics/             # Usage analytics aggregation
│       ├── user-service/          # Profiles, follows
│       ├── marketplace/           # Stripe purchases
│       └── safety-service/        # Python FastAPI content moderation
│
├── packages/
│   ├── database/                  # Shared Prisma schema + generated client
│   │   └── prisma/schema.prisma   # 30+ models
│   ├── types/                     # Shared TypeScript interfaces
│   └── tsconfig/                  # Shared TS configurations
│
├── docker-compose.yml             # Local dev: PostgreSQL, Redis, Meilisearch + all services
├── render.yaml                    # Render.com multi-service deployment blueprint
├── vercel.json                    # Vercel frontend configuration
├── turbo.json                     # Turborepo pipeline configuration
├── SETUP.md                       # Detailed setup guide
└── Makefile                       # Developer shortcuts
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **pnpm** 9+ — `npm install -g pnpm`
- **Docker + Docker Compose** — for local services
- A [Neon](https://neon.tech/) PostgreSQL database (free tier works)
- A [Groq](https://console.groq.com/) API key (free tier works)

### 1. Clone and install

```bash
git clone https://github.com/your-username/promptforge.git
cd promptforge
pnpm install
```

### 2. Configure environment

```bash
cp apps/frontend/.env.example apps/frontend/.env.local
```

Edit `apps/frontend/.env.local` with your credentials (see [Environment Variables](#environment-variables)).

### 3. Set up the database

Enable required extensions in your Neon SQL editor:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

Push the Prisma schema:

```bash
pnpm --filter @promptforge/database db:push
```

### 4. Run the frontend

```bash
pnpm --filter frontend dev
```

Visit **http://localhost:3000**

### 5. (Optional) Start all backend services

```bash
make docker-up
```

---

## Environment Variables

Create `apps/frontend/.env.local` with the following:

```env
# ── Database ────────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# ── Authentication ──────────────────────────────────────────────────────────
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NEXTAUTH_SECRET=your-nextauth-secret

# ── AI Providers ─────────────────────────────────────────────────────────────
GROQ_API_KEY=gsk_...                         # Required — primary inference
OPENAI_API_KEY=sk-...                        # Optional — semantic search embeddings

# ── OAuth (optional) ─────────────────────────────────────────────────────────
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# ── App ──────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

> **Minimum to run:** `DATABASE_URL`, `JWT_SECRET`, and `GROQ_API_KEY`.

---

## Database Setup

The schema lives in `packages/database/prisma/schema.prisma` and includes 30+ models:

| Domain | Models |
|---|---|
| **Users & Auth** | `User`, `RefreshToken` |
| **Prompts** | `Prompt`, `PromptVersion`, `PromptTag`, `PromptEmbedding`, `PromptRelease` |
| **Social** | `Comment`, `Upvote`, `Follow` |
| **Collections** | `Collection`, `CollectionItem` |
| **Execution** | `PromptExecution`, `PlaygroundSession` |
| **Marketplace** | `Purchase` |
| **Battle Arena** | `BattleSession`, `BattleVote` |
| **Evaluation** | `EvalSuite`, `EvalCase`, `EvalRun`, `EvalResult` |
| **Benchmarking** | `BenchmarkSuite`, `BenchmarkRun` |
| **RAG** | `RagWorkspace`, `RagDocument`, `RagChunk` |
| **Datasets** | `Dataset`, `TrainingRun` |
| **Gamification** | `Badge`, `UserBadge`, `DailyChallenge`, `ChallengeSubmission` |
| **Developer** | `ApiKey`, `Notification` |

### Common commands

```bash
# Push schema changes to database
pnpm --filter @promptforge/database db:push

# Open Prisma Studio (visual database browser)
pnpm --filter @promptforge/database db:studio

# Generate Prisma client after schema changes
pnpm --filter @promptforge/database db:generate
```

---

## Available Scripts

From the monorepo root:

```bash
pnpm dev                    # Start all apps in development mode
pnpm build                  # Build all packages and apps
pnpm lint                   # Lint all packages
pnpm typecheck              # Type-check all packages
```

Frontend only:

```bash
pnpm --filter frontend dev         # Start Next.js dev server
pnpm --filter frontend build       # Production build
pnpm --filter frontend start       # Start production server
```

Make shortcuts:

```bash
make dev          # Start all services with hot reload
make docker-up    # Start via Docker Compose
make docker-down  # Stop all Docker services
make db-push      # Push database schema
make db-studio    # Open Prisma Studio
make logs         # Tail service logs
make clean        # Remove build artifacts
```

---

## API Reference

All routes are under `/api/`. Auth-protected routes require `Authorization: Bearer <token>`.

### Prompts
```
GET    /api/prompts                        List prompts (filterable)
POST   /api/prompts                        Create prompt
GET    /api/prompts/:id                    Get prompt with versions
PUT    /api/prompts/:id                    Update prompt
DELETE /api/prompts/:id                    Delete prompt
POST   /api/prompts/:id/fork               Fork a prompt
POST   /api/prompts/:id/upvote             Toggle upvote
GET    /api/prompts/:id/similar            Semantic similar prompts
GET    /api/prompts/:id/graph              Fork/version dependency graph
POST   /api/prompts/lint                   Lint prompt for issues
```

### Playground
```
POST   /api/playground/execute             Execute on one model
POST   /api/playground/stream              Stream response (SSE)
POST   /api/playground/compare             Compare across models
POST   /api/playground/optimize            AI-powered prompt optimizer
POST   /api/playground/safety              Safety & risk analysis
POST   /api/playground/translate           Translate prompt
```

### Evaluation & Testing
```
GET    /api/prompts/:id/eval               List eval suites
POST   /api/prompts/:id/eval               Create eval suite
POST   /api/prompts/:id/eval/:suiteId/run  Run evaluation
GET    /api/prompts/:id/benchmarks         List benchmark suites
POST   /api/prompts/:id/benchmarks/:id/run Run across all models
```

### Battle Arena
```
GET    /api/battle/sessions                List active battles
POST   /api/battle/sessions                Create battle (admin)
GET    /api/battle/sessions/:id            Get battle details
POST   /api/battle/sessions/:id/vote       Cast vote
GET    /api/battle/leaderboard             ELO leaderboard
```

### RAG
```
GET    /api/rag/workspaces                 List workspaces
POST   /api/rag/workspaces                 Create workspace
POST   /api/rag/workspaces/:id/documents   Upload document
POST   /api/rag/workspaces/:id/query       Query with context retrieval
```

### Datasets
```
GET    /api/datasets                       List datasets
POST   /api/datasets                       Create dataset
POST   /api/datasets/:id/train             Generate prompt from data
```

### Observability
```
GET    /api/observability                  Execution metrics, cost trends, drift
```

---

## Deployment

### Frontend → Vercel

1. Push to GitHub
2. Import at [vercel.com/new](https://vercel.com/new)
3. Set **Root Directory** to `apps/frontend`
4. Add all environment variables
5. Deploy

```bash
# Or via CLI
pnpm --filter frontend build
vercel --cwd apps/frontend
```

### Backend → Render

The `render.yaml` at the repo root defines all 9 services. Connect your GitHub repo on [Render](https://render.com/), click **New → Blueprint**, and Render will provision everything automatically.

### Database → Neon

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string
3. Run `pnpm --filter @promptforge/database db:push` with `DATABASE_URL` set

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push the branch: `git push origin feat/my-feature`
5. Open a Pull Request

Please ensure:
- TypeScript compiles without errors (`pnpm typecheck`)
- Lint passes (`pnpm lint`)
- New API routes follow the existing `Promise<NextResponse>` return type pattern
- New Prisma models use `@default(dbgenerated("gen_random_uuid()")) @db.Uuid` for IDs

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">
  <strong>Built with PromptForge — forge better prompts.</strong>
</div>
