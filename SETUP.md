# PromptForge — Setup Guide

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker + Docker Compose (for local services)
- Git

## Quick Start (Frontend Only)

The fastest way to see the landing page:

```bash
cd apps/frontend
cp .env.example .env.local
pnpm install
pnpm dev
```

Visit http://localhost:3000 🚀

---

## Full Stack Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up External Services

#### Neon PostgreSQL (Free)
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project → Copy the connection string
3. Enable the `pgvector` extension in SQL editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```
4. Save as `DATABASE_URL`

#### Upstash Redis (Free)
1. Sign up at [upstash.com](https://upstash.com)
2. Create a Redis database
3. Copy `REDIS_URL` and `REDIS_TOKEN`

#### GitHub OAuth App
1. GitHub → Settings → Developer Settings → OAuth Apps → New
2. Homepage URL: `http://localhost:3000`
3. Callback URL: `http://localhost:4001/api/auth/github/callback`
4. Save `Client ID` and `Client Secret`

#### Google OAuth
1. [console.cloud.google.com](https://console.cloud.google.com)
2. APIs & Services → Credentials → Create OAuth 2.0 Client
3. Authorized redirect URIs: `http://localhost:4001/api/auth/google/callback`
4. Save `Client ID` and `Client Secret`

### 3. Configure Environment Variables

Copy the example files:
```bash
cp apps/frontend/.env.example apps/frontend/.env.local
```

Create a root `.env` for Docker Compose:
```bash
cat > .env << EOF
DATABASE_URL=postgresql://...  # from Neon
REDIS_URL=redis://...          # from Upstash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
EOF
```

### 4. Run Database Migrations

```bash
make db-push
make db-seed   # optional: seed sample prompts
```

### 5. Start All Services

```bash
# Option A: Docker Compose (recommended)
make docker-up

# Option B: Individual services
make dev
```

---

## Deployment

### Frontend → Vercel

1. Push to GitHub
2. Import repo at [vercel.com](https://vercel.com)
3. Set root directory: `apps/frontend`
4. Add all environment variables from `.env.local`
5. Deploy! ✨

Vercel auto-detects Next.js and configures everything.

### Backend Services → Render

1. Push to GitHub
2. Go to [render.com](https://render.com) → New → Blueprint
3. Connect your GitHub repo
4. Render reads `render.yaml` and creates all 9 services
5. Add environment variables for each service in the Render dashboard
6. Deploy!

---

## Clash Display Font

The design uses **Clash Display** (by Indian Type Foundry). Download from:
- [fontshare.com](https://www.fontshare.com/fonts/clash-display) (Free)

Place the `.woff2` files in `apps/frontend/public/fonts/`:
- `ClashDisplay-Regular.woff2`
- `ClashDisplay-Medium.woff2`
- `ClashDisplay-Semibold.woff2`
- `ClashDisplay-Bold.woff2`

> **Fallback:** If fonts aren't downloaded yet, the design uses `system-ui` which still looks great.

---

## Environment Variables Reference

### Frontend (`apps/frontend/.env.local`)
| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Yes | Your app URL |
| `NEXT_PUBLIC_API_URL` | Yes | Backend API gateway URL |

### Auth Service
| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Neon PostgreSQL URL |
| `REDIS_URL` | Yes | Upstash Redis URL |
| `JWT_SECRET` | Yes | Random 64-char string |
| `JWT_REFRESH_SECRET` | Yes | Random 64-char string |
| `GITHUB_CLIENT_ID` | Phase 2 | GitHub OAuth |
| `GOOGLE_CLIENT_ID` | Phase 2 | Google OAuth |

### AI Execution Service
| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Phase 3 | Claude API |
| `OPENAI_API_KEY` | Phase 3 | OpenAI API |
| `GOOGLE_API_KEY` | Optional | Gemini API |
| `MISTRAL_API_KEY` | Optional | Mistral API |

---

## Project Structure

```
promptforge/
├── apps/
│   ├── frontend/              # Next.js 15 → Vercel
│   └── services/
│       ├── auth-service/      # NestJS → Render
│       ├── ai-execution/      # NestJS → Render
│       ├── safety-service/    # FastAPI → Render
│       └── ...
├── packages/
│   ├── database/              # Prisma schema (shared)
│   ├── types/                 # TypeScript types (shared)
│   └── tsconfig/              # TypeScript configs (shared)
├── docker-compose.yml         # Local dev
├── render.yaml                # Render deployment
├── vercel.json                # Vercel config
└── Makefile                   # Dev shortcuts
```

---

## Common Commands

```bash
make dev              # Start everything
make db-studio        # Prisma Studio (DB GUI)
make logs             # View service logs
make build            # Build all packages
make test             # Run tests
make clean            # Clean up
```
