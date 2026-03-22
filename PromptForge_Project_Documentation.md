# PromptForge 
## *Cloud-Native AI Prompt Sharing & API Playground Platform with Full DevOps Automation*

> **"GitHub meets Postman meets Figma — for the age of AI."**
> A production-grade, microservices-based web platform for discovering, crafting, testing, versioning, and sharing AI prompts — deployed end-to-end with a world-class DevOps pipeline.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement & Vision](#2-problem-statement--vision)
3. [Core Features](#3-core-features)
4. [Advanced & Mindblowing Features](#4-advanced--mindblowing-features)
5. [Microservices Architecture](#5-microservices-architecture)
6. [Full Tech Stack](#6-full-tech-stack)
7. [Database Design](#7-database-design)
8. [Frontend Design System](#8-frontend-design-system)
9. [AI Integration Layer](#9-ai-integration-layer)
10. [DevOps Pipeline — Complete Breakdown](#10-devops-pipeline--complete-breakdown)
11. [Infrastructure as Code (Terraform)](#11-infrastructure-as-code-terraform)
12. [Configuration Management (Ansible)](#12-configuration-management-ansible)
13. [Kubernetes Orchestration](#13-kubernetes-orchestration)
14. [CI/CD Pipeline (GitHub Actions)](#14-cicd-pipeline-github-actions)
15. [Monitoring, Observability & Self-Healing](#15-monitoring-observability--self-healing)
16. [Security Architecture](#16-security-architecture)
17. [Cloud Infrastructure](#17-cloud-infrastructure)
18. [Project Folder Structure](#18-project-folder-structure)
19. [API Specifications](#19-api-specifications)
20. [Deployment Runbook](#20-deployment-runbook)
21. [Why This Project Is Exceptional](#21-why-this-project-is-exceptional)

---

## 1. Project Overview

**PromptForge** is a full-stack, cloud-native web platform that sits at the intersection of **AI tooling**, **developer collaboration**, and **DevOps engineering**.

It allows users to:

- 📚 **Discover** a curated library of community AI prompts
- 🧪 **Test** prompts live across multiple AI models (GPT-4, Claude, Gemini, Mistral)
- ⚖️ **Compare** outputs side-by-side with visual diff tools
- 🔄 **Version** prompts like code — full history, branching, and rollback
- 🌐 **Collaborate** with a community through upvotes, comments, and forking
- 📊 **Analyze** prompt performance with usage analytics dashboards
- 🤖 **Auto-optimize** prompts using an AI-powered suggestion engine
- 🔐 **Monetize** premium prompts through a built-in marketplace

The platform is engineered as a **polyglot microservices system** and deployed using a **fully automated DevOps pipeline** covering containerization, CI/CD, Infrastructure as Code, configuration management, Kubernetes orchestration, and production-grade monitoring.

---

## 2. Problem Statement & Vision

### The Problem

Prompt engineering is now a core skill in AI-driven development. Yet:

- There is **no standard platform** to share, version, or collaborate on prompts
- Developers waste hours **re-inventing prompts** that already exist
- There is **no easy way** to A/B test prompts or compare model outputs
- Prompt quality is **unmeasurable** without tooling
- Sharing prompts across teams has **no workflow or governance**

### The Vision

PromptForge solves this by being the **definitive prompt engineering workspace** — a platform that treats prompts as first-class software artifacts with versioning, testing, review, and deployment workflows.

---

## 3. Core Features

### 3.1 Prompt Library

A community-curated, searchable repository of AI prompts.

- **Browse by Category**: Coding, Writing, Marketing, Research, Education, DevOps, Legal, Finance, Creative, Health
- **Smart Tags**: Multi-dimensional tagging with model compatibility flags (e.g., `gpt-4-optimized`, `claude-friendly`)
- **Top Charts**: Trending, Most Used This Week, Editor's Picks, Newcomers
- **Advanced Search**: Full-text search via Meilisearch with fuzzy matching, filters by model, category, length, language
- **Prompt Cards**: Rich preview cards showing prompt snippet, output preview thumbnail, rating, usage count, author

### 3.2 AI Playground

An interactive prompt testing studio with real-time AI execution.

- **Multi-Model Execution**: Run the same prompt on GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro, Mistral Large simultaneously
- **Variable Injection**: Define `{{variables}}` in prompts and fill them via form UI
- **System Prompt Editor**: Set system context separately from user prompt
- **Token Counter**: Live token estimation before execution
- **Output Renderer**: Render Markdown, code with syntax highlighting, JSON pretty-print, tables
- **Response Metadata**: Show token usage, latency, cost estimate per model
- **Chat Mode**: Multi-turn conversation testing with full message history

### 3.3 Prompt Versioning

Full Git-inspired version control for prompts.

- **Version History**: Every edit creates a new immutable version with timestamp and changelog note
- **Diff Viewer**: Side-by-side text diff between any two versions
- **Rollback**: Restore any previous version instantly
- **Branching**: Fork a prompt into an experimental branch
- **Merge Requests**: Propose changes to community prompts via merge-style workflow
- **Semantic Versioning**: Auto-label versions as `major`, `minor`, `patch` based on change size

### 3.4 Prompt Comparison Engine

Scientific prompt A/B testing.

- **Side-by-Side**: Run Prompt A vs Prompt B on the same input and model
- **Multi-Prompt Bracket**: Compare up to 4 prompts simultaneously in a grid
- **Blind Voting**: Community votes on best output without seeing which prompt generated it
- **Metrics**: Measure output length, readability score (Flesch-Kincaid), sentiment, code correctness
- **Export Comparison Report**: Download as PDF or shareable link

### 3.5 Community Platform

Social collaboration features.

- **Upvote / Downvote**: Reddit-style voting system
- **Comments & Threads**: Nested comment system with Markdown support
- **Prompt Forking**: Fork any public prompt into your own workspace
- **Collections**: Curate prompt collections like playlists
- **Follow System**: Follow creators, get activity feeds
- **Achievement Badges**: Gamified contributor recognition (First Prompt, 100 Upvotes, Top Contributor)
- **Creator Profiles**: Public profile pages with prompt portfolios and stats

---

## 4. Advanced & Mindblowing Features

### 4.1 🤖 AI Prompt Optimizer (Meta-AI Feature)

A Claude-powered meta-layer that **analyzes and rewrites your prompt** to make it better.

- Automatically suggests improvements based on prompt engineering best practices
- Explains *why* each change improves the prompt (Chain-of-thought explanations)
- Offers style presets: "Make this more precise", "Add constraints", "Make it few-shot", "Convert to ReAct format"
- Scores original vs. optimized prompt on a 10-point rubric: Clarity, Specificity, Context, Examples, Output Format

### 4.2 🧬 Prompt DNA Visualizer

An interactive 3D graph visualization (Three.js + React Three Fiber) showing:

- **Prompt Genealogy**: Visual family tree of a prompt's fork history
- **Semantic Clusters**: Prompts clustered by embedding similarity in a 3D space — explore semantically related prompts by flying through a galaxy of glowing nodes
- **Influence Map**: See which prompts inspired which, like an idea phylogenetic tree
- **Animated Connections**: Real-time edge animations when a new fork or merge happens

### 4.3 📈 Prompt Analytics Dashboard

A full Grafana-style analytics panel per prompt:

- **Usage Over Time**: Line chart of daily/weekly executions
- **Model Distribution**: Pie chart of which models users run this prompt on
- **Geography Heatmap**: World map of where this prompt is being used
- **Output Quality Trend**: Track community rating over versions
- **Latency Percentiles**: P50/P95/P99 response times across models
- **Cost Tracker**: Running total of API cost generated by this prompt

### 4.4 🏪 Prompt Marketplace

A monetization layer for premium prompts.

- **Paid Prompts**: Creators list prompts for $1–$50 one-time or subscription access
- **Stripe Integration**: Secure payment processing via Stripe Connect
- **Revenue Dashboard**: Earnings, payout history, top-performing prompts
- **License System**: Prompts have Open, Commercial-Use-Allowed, or Exclusive licenses
- **Prompt Bundles**: Package related prompts into themed bundles (e.g., "The Full-Stack Dev Bundle")
- **Subscription Tiers**: Users subscribe to creators like Patreon

### 4.5 🔌 Prompt API (Developer Access)

PromptForge as a headless prompt management backend for developers.

- **REST & GraphQL API**: Programmatic access to the prompt library
- **SDK**: JavaScript and Python SDKs for integrating PromptForge prompts into external apps
- **Webhooks**: Subscribe to events (new version published, upvote threshold hit) for automation
- **Prompt Injection**: Embed PromptForge prompts into your own app via a single API call
- **API Key Management**: Per-project keys with rate limits and usage tracking

### 4.6 🧠 RAG-Augmented Prompts (Retrieval-Augmented Generation)

Users can attach knowledge bases to prompts.

- **Document Upload**: Upload PDFs, text files, or web URLs as context documents
- **Auto-Chunking & Embedding**: Documents are automatically chunked and embedded (using pgvector)
- **RAG Toggle**: Enable/disable RAG mode per test run
- **Context Preview**: See which document chunks were retrieved for a given query
- **Shared Knowledge Bases**: Teams can share a knowledge base across prompts

### 4.7 🎮 Prompt Battle Arena

A gamified community engagement feature.

- **Weekly Tournaments**: Community-submitted prompts compete in themed challenges (e.g., "Best Resume Writer")
- **Blind Judging**: Users vote on best output without seeing which prompt produced it
- **ELO Rating System**: Prompts gain/lose rating points based on battle outcomes
- **Leaderboard**: Live tournament standings with real-time updates via WebSockets
- **Prize System**: Top prompts get "Legendary" badge, creator gets featured on homepage

### 4.8 🌍 Multilingual Prompt Studio

- **Translate Prompt**: Auto-translate any prompt to 50+ languages using DeepL API
- **Cross-Lingual Testing**: Test a prompt in English and Spanish simultaneously, compare outputs
- **Language Detection**: Auto-detect prompt language and suggest model best suited for it
- **RTL Support**: Full right-to-left language UI support (Arabic, Hebrew)

### 4.9 📦 Prompt as Code (PaC)

Treat prompts like software with a YAML/JSON schema.

```yaml
# promptforge.yaml
name: "expert-code-reviewer"
version: "2.4.1"
model: claude-3-5-sonnet
temperature: 0.3
max_tokens: 2000
system: "You are a senior software engineer..."
user: "Review the following {{language}} code for {{criteria}}:"
variables:
  language: string
  criteria: enum[security, performance, readability]
tags: [coding, review, devops]
```

- **CLI Tool**: `promptforge run expert-code-reviewer --var language=python`
- **Import/Export**: Share `promptforge.yaml` files via GitHub Gists
- **Schema Validation**: Lint prompt YAML files in CI pipelines
- **Prompt Registries**: Private organizational prompt registries (like npm for prompts)

### 4.10 🔍 Semantic Prompt Search

Beyond keyword search — find prompts by *meaning*.

- All prompts are embedded using OpenAI `text-embedding-3-large` or a self-hosted `sentence-transformers` model
- Embeddings stored in **pgvector** (PostgreSQL extension)
- Search returns semantically similar prompts even if they share no keywords
- Example: Searching *"help me prepare for a technical interview"* returns prompts tagged `coding`, `career`, `interview-prep` even if none contain "prepare"

### 4.11 🎨 Prompt Template Builder (Visual No-Code)

A drag-and-drop interface for building complex prompt templates.

- **Block Editor**: Compose prompts from blocks: System Block, Context Block, Instruction Block, Example Block, Output Format Block
- **Conditional Logic**: Add if/else branching in prompts ("If the topic is code, add language constraint")
- **Preview Mode**: See how the assembled prompt looks with sample variable values
- **Export**: Export as plain text, JSON schema, or Python string

### 4.12 🛡 Prompt Safety Scanner

Automatic safety analysis before execution.

- **Jailbreak Detection**: Detect prompt injection and jailbreak attempts using a fine-tuned classifier
- **PII Detector**: Flag if user input contains email addresses, phone numbers, SSNs before sending to AI
- **Toxicity Filter**: Score prompt for harmful content before and after AI execution
- **Safety Report**: Per-prompt safety score displayed on library cards
- **Red Team Mode**: Intentionally stress-test prompts against adversarial inputs (for security researchers)

---

## 5. Microservices Architecture

PromptForge is split into **10 independent microservices**, each with its own codebase, database, Docker container, and Kubernetes deployment.

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT LAYER                      │
│         Next.js Frontend (Vercel / K8s)             │
└───────────────────┬─────────────────────────────────┘
                    │ HTTPS
┌───────────────────▼─────────────────────────────────┐
│              API GATEWAY (Kong)                     │
│    Rate Limiting │ Auth Validation │ Routing        │
└──┬────┬────┬────┬────┬────┬────┬──┘
   │    │    │    │    │    │    │
   ▼    ▼    ▼    ▼    ▼    ▼    ▼
 [1]  [2]  [3]  [4]  [5]  [6]  [7]  [8]  [9]  [10]
Auth Prompt Play  AI  Search Anal Notif Market User  Safety
 Svc   Svc  Svc  Exec  Svc   Svc   Svc   Svc   Svc   Svc
  │     │    │    │      │     │     │     │     │     │
  └─────┴────┴────┴──────┴─────┘     │     │     │     │
            Message Bus (Redis Pub/Sub / RabbitMQ)
```

### Service Breakdown

| # | Service | Tech | Responsibility | DB |
|---|---------|------|---------------|-----|
| 1 | **Auth Service** | NestJS + Passport | Registration, Login, JWT, OAuth (Google/GitHub), 2FA | PostgreSQL |
| 2 | **Prompt Service** | NestJS | CRUD for prompts, versions, categories, tags, collections | PostgreSQL |
| 3 | **Playground Service** | NestJS | Prompt execution sessions, history, comparison sessions | PostgreSQL + Redis |
| 4 | **AI Execution Service** | NestJS | Routes to OpenAI/Anthropic/Gemini, manages API keys, queues | Redis Queue |
| 5 | **Search Service** | NestJS + Meilisearch | Full-text + semantic search, indexing, autocomplete | Meilisearch + pgvector |
| 6 | **Analytics Service** | NestJS | Usage events, metrics aggregation, dashboard data | TimescaleDB |
| 7 | **Notification Service** | NestJS | Email (Resend), push notifications, activity feed | PostgreSQL + Redis |
| 8 | **Marketplace Service** | NestJS + Stripe | Payments, purchases, subscriptions, payouts | PostgreSQL |
| 9 | **User Service** | NestJS | Profiles, follows, badges, achievements, social graph | PostgreSQL |
| 10 | **Safety Service** | Python FastAPI | Jailbreak detection, PII scanning, toxicity scoring | Redis Cache |

### Inter-Service Communication

- **Synchronous**: REST over HTTP/2 for user-facing request-response flows
- **Asynchronous**: Redis Pub/Sub and RabbitMQ for events (prompt executed, upvote received, payment confirmed)
- **Service Discovery**: Kubernetes DNS (`auth-service.default.svc.cluster.local`)
- **Circuit Breaker**: Implemented using `nestjs-resilience` to prevent cascade failures

---

## 6. Full Tech Stack

### Frontend

| Layer | Technology | Reason |
|-------|-----------|--------|
| Framework | **Next.js 15** (App Router) | SSR, SEO, React Server Components, streaming |
| Language | **TypeScript** | Type safety across the entire codebase |
| 3D / WebGL | **Three.js + React Three Fiber** | Prompt DNA visualizer, particle effects, 3D cards |
| Animation | **Framer Motion + GSAP** | Page transitions, micro-interactions, scroll animations |
| Smooth Scroll | **Lenis** | Buttery smooth scrolling experience |
| Styling | **Tailwind CSS + shadcn/ui** | Utility-first, accessible component library |
| State Management | **Zustand + TanStack Query** | Global UI state + server state with caching |
| Real-Time | **Socket.io client** | Live battle arena, real-time voting, live output streaming |
| Code Editor | **CodeMirror 6** | In-browser prompt editor with syntax highlighting |
| Charts | **Recharts + D3.js** | Analytics dashboards, prompt genealogy graphs |
| Forms | **React Hook Form + Zod** | Type-safe form validation |
| i18n | **next-intl** | Multilingual support |
| Testing | **Vitest + Playwright** | Unit tests and E2E tests |

### Backend (All Microservices)

| Layer | Technology | Reason |
|-------|-----------|--------|
| Framework | **NestJS** | Modular, scalable, microservice-ready, DI built-in |
| Language | **TypeScript** (Node.js) | Consistent with frontend, strong typing |
| Safety Service | **Python FastAPI** | ML/NLP ecosystem for safety classifiers |
| ORM | **Prisma** | Type-safe database access, migrations, schema |
| Validation | **class-validator + Zod** | Runtime and compile-time validation |
| Auth | **Passport.js + JWT** | Industry-standard auth strategy |
| Caching | **Redis (ioredis)** | Session caching, rate limiting, pub/sub |
| Queue | **BullMQ** | AI execution queue with retry, priority, concurrency |
| WebSockets | **Socket.io** | Real-time features (battle arena, live output) |
| HTTP Client | **Axios** | Service-to-service API calls |
| Testing | **Jest + Supertest** | Unit and integration tests |
| Docs | **Swagger/OpenAPI** | Auto-generated API documentation |

### AI / ML Layer

| Component | Technology |
|-----------|-----------|
| Primary AI APIs | OpenAI (GPT-4o, GPT-4o-mini), Anthropic (Claude 3.5 Sonnet), Google (Gemini 1.5 Pro), Mistral (Mistral Large) |
| Embeddings | OpenAI `text-embedding-3-large` / `sentence-transformers` (self-hosted) |
| Vector DB | **pgvector** (PostgreSQL extension) |
| Safety Classifier | **Hugging Face Transformers** (fine-tuned DistilBERT) |
| Translation | **DeepL API** |
| Streaming | **Server-Sent Events (SSE)** for token streaming |

### Databases

| Database | Use Case | Hosting |
|---------|----------|---------|
| **PostgreSQL 16** | Primary relational DB (users, prompts, comments) | Neon (free tier) |
| **TimescaleDB** | Time-series analytics, usage metrics | Self-hosted on K8s |
| **Redis 7** | Caching, sessions, queues, pub/sub | Upstash (free tier) |
| **Meilisearch** | Full-text search with typo-tolerance | Self-hosted on K8s |
| **pgvector** | Semantic similarity search (extension on PostgreSQL) | Same Neon instance |

### DevOps & Infrastructure

| Tool | Purpose |
|------|---------|
| **Git / GitHub** | Version control, PR workflow, branch protection |
| **Docker** | Containerize every microservice |
| **Docker Compose** | Local development multi-service orchestration |
| **GitHub Actions** | CI/CD pipeline automation |
| **Terraform** | Infrastructure provisioning on Oracle Cloud |
| **Ansible** | Configuration management, server setup |
| **Kubernetes (k3s)** | Container orchestration in production |
| **Helm** | Kubernetes package manager for deployments |
| **Kong** | API Gateway (routing, auth, rate limiting) |
| **NGINX Ingress** | K8s Ingress Controller |
| **Cert-Manager** | Automatic TLS/SSL certificates (Let's Encrypt) |
| **Prometheus** | Metrics collection |
| **Grafana** | Metrics dashboards |
| **Loki** | Log aggregation |
| **Jaeger** | Distributed tracing |
| **GitHub Container Registry** | Docker image storage |
| **Oracle Cloud Free Tier** | Production cloud infrastructure |
| **Minikube / k3s** | Local and lightweight K8s |

---

## 7. Database Design

### Core Tables (PostgreSQL)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  oauth_provider VARCHAR(50),
  oauth_id VARCHAR(255),
  avatar_url TEXT,
  bio TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  reputation_score INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prompts
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  current_version_id UUID,
  category_id INT REFERENCES categories(id),
  visibility ENUM('public', 'private', 'unlisted') DEFAULT 'public',
  is_premium BOOLEAN DEFAULT FALSE,
  price DECIMAL(10,2),
  fork_of UUID REFERENCES prompts(id),
  view_count INT DEFAULT 0,
  execution_count INT DEFAULT 0,
  upvote_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prompt Versions
CREATE TABLE prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  version_number VARCHAR(20) NOT NULL,  -- e.g., "2.4.1"
  system_prompt TEXT,
  user_prompt TEXT NOT NULL,
  variables JSONB,                       -- {"name": "string", "tone": "enum[formal,casual]"}
  model_settings JSONB,                  -- {"temperature": 0.7, "max_tokens": 2000}
  changelog TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prompt_id, version_number)
);

-- Prompt Executions (append-only analytics log)
CREATE TABLE prompt_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES prompts(id),
  version_id UUID REFERENCES prompt_versions(id),
  user_id UUID REFERENCES users(id),
  model VARCHAR(100) NOT NULL,
  input_variables JSONB,
  output TEXT,
  input_tokens INT,
  output_tokens INT,
  latency_ms INT,
  cost_usd DECIMAL(10,6),
  error TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id),
  parent_id UUID REFERENCES comments(id),   -- nested replies
  content TEXT NOT NULL,
  upvote_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collections
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE collection_prompts (
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  position INT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(collection_id, prompt_id)
);

-- Tags
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  usage_count INT DEFAULT 0
);

CREATE TABLE prompt_tags (
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  tag_id INT REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY(prompt_id, tag_id)
);

-- Follows
CREATE TABLE follows (
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(follower_id, following_id)
);

-- Marketplace Purchases
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES users(id),
  prompt_id UUID REFERENCES prompts(id),
  amount_paid DECIMAL(10,2),
  stripe_payment_intent_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Semantic Search Index (pgvector)
CREATE TABLE prompt_embeddings (
  prompt_id UUID PRIMARY KEY REFERENCES prompts(id) ON DELETE CASCADE,
  embedding vector(1536),               -- OpenAI embedding dimension
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON prompt_embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

---

## 8. Frontend Design System

### Visual Design Language

The UI is designed to Awwwards quality — **dark-by-default**, with neon accent lighting, glassmorphism panels, and fluid 3D elements that feel alive.

**Color Palette:**
```
Background:     #0A0A0F (near-black space)
Surface:        #13131A (card surface)
Surface 2:      #1C1C28 (elevated surface)
Border:         #2A2A3A (subtle borders)
Primary:        #6C63FF (electric violet)
Secondary:      #00D4FF (neon cyan)
Accent:         #FF6B6B (coral red)
Text Primary:   #F0F0FF (near-white)
Text Secondary: #8888AA (muted)
Success:        #00E5AA (emerald)
Warning:        #FFB800 (amber)
```

**Typography:**
- Display: `Clash Display` (variable weight, geometric)
- Body: `Inter` (neutral, readable)
- Monospace: `JetBrains Mono` (code/prompts)

### Key UI Components

**1. Prompt Card (3D floating)**
```
┌──────────────────────────────────┐
│ [Icon] CODING              ⭐4.9 │
│                                  │
│  "You are a senior TypeScript    │
│  engineer. Review this code..."  │
│                                  │
│ 🏷 typescript  api  review       │
│                                  │
│ 👤 @mkumar  ↑ 2.4k  ▶ 18.2k    │
│                      [Run Now →] │
└──────────────────────────────────┘
```

**2. Playground Layout**
```
┌─────────────────┬──────────────────┐
│  PROMPT EDITOR  │   MODEL OUTPUT   │
│ ┌─────────────┐ │ ┌──────────────┐ │
│ │ System:     │ │ │ GPT-4o       │ │
│ │ [editor]    │ │ │ [output]     │ │
│ │             │ │ │ 312 tokens   │ │
│ │ User:       │ │ │ 0.8s, $0.004│ │
│ │ [editor]    │ │ └──────────────┘ │
│ └─────────────┘ │ ┌──────────────┐ │
│ Variables:      │ │ Claude 3.5   │ │
│ [form inputs]   │ │ [output]     │ │
│                 │ │ 289 tokens   │ │
│ [▶ Run All]     │ │ 1.1s, $0.003│ │
└─────────────────┴──────────────────┘
```

**3. Prompt DNA Galaxy**

A full-screen Three.js canvas where:
- Each prompt = a glowing sphere
- Forks = smaller orbiting satellites connected by bezier curves
- Semantic clusters = color-coded nebulae
- Clicking a node opens prompt details in a floating panel
- Camera flies through the galaxy on scroll

---

## 9. AI Integration Layer

### AI Execution Service Architecture

```
User Request
    │
    ▼
AI Execution Service (NestJS)
    │
    ├── Rate Limiter (Redis)
    │
    ├── Cost Estimator (pre-flight)
    │
    ├── Provider Router
    │   ├── OpenAI Provider (gpt-4o, gpt-4o-mini)
    │   ├── Anthropic Provider (claude-3-5-sonnet)
    │   ├── Google Provider (gemini-1.5-pro)
    │   └── Mistral Provider (mistral-large)
    │
    ├── BullMQ Queue (async execution)
    │
    ├── SSE Streaming (token-by-token output)
    │
    └── Execution Logger → Analytics Service
```

### Provider Abstraction Interface

```typescript
interface AIProvider {
  name: string;
  supportedModels: string[];
  execute(request: ExecutionRequest): AsyncGenerator<ExecutionChunk>;
  estimateCost(tokens: TokenCount): number;
  getCapabilities(): ModelCapabilities;
}

interface ExecutionRequest {
  systemPrompt?: string;
  userPrompt: string;
  variables: Record<string, string>;
  model: string;
  temperature: number;
  maxTokens: number;
  stream: boolean;
}
```

### Streaming Architecture (SSE)

When a user runs a prompt, the AI Execution Service:

1. Validates and queues the request via **BullMQ**
2. Routes to the appropriate provider SDK
3. Opens an SSE connection back to the client
4. Streams tokens as they arrive: `data: {"token": "Hello", "index": 0}\n\n`
5. Sends completion event with metadata: `data: {"done": true, "usage": {...}}\n\n`
6. Logs the execution to the Analytics Service asynchronously

---

## 10. DevOps Pipeline — Complete Breakdown

```
Developer Pushes Code
        │
        ▼
  GitHub Repository
        │
  GitHub Actions Trigger
        │
   ┌────▼────┐
   │  STAGE 1 │  Code Quality
   │  Lint    │  ESLint, Prettier check
   │  Type    │  TypeScript compile check
   └────┬────┘
        │
   ┌────▼────┐
   │  STAGE 2 │  Testing
   │  Unit    │  Jest (per service)
   │  Integr. │  Supertest API tests
   │  E2E     │  Playwright (frontend)
   └────┬────┘
        │
   ┌────▼────┐
   │  STAGE 3 │  Build
   │  Docker  │  Build images per service
   │  Push    │  Push to GHCR
   └────┬────┘
        │
   ┌────▼────┐
   │  STAGE 4 │  Security Scan
   │  Trivy   │  Container vulnerability scan
   │  SAST    │  CodeQL static analysis
   └────┬────┘
        │
   ┌────▼────┐
   │  STAGE 5 │  Deploy Staging
   │  Helm    │  Deploy to staging namespace
   │  Smoke   │  Automated smoke tests
   └────┬────┘
        │
   ┌────▼────┐  (manual approval gate)
   │  STAGE 6 │  Deploy Production
   │  Helm    │  Rolling update in prod
   │  Verify  │  Health check all pods
   └─────────┘
```

---

## 11. Infrastructure as Code (Terraform)

All cloud infrastructure is provisioned via Terraform — **no manual cloud console clicks**.

### Terraform Module Structure

```
terraform/
├── main.tf                    # Root module
├── variables.tf               # Input variables
├── outputs.tf                 # Output values
├── terraform.tfvars           # Variable values (gitignored)
├── modules/
│   ├── compute/               # VM instances
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── networking/            # VCN, subnets, security lists
│   ├── kubernetes/            # K3s cluster setup
│   ├── storage/               # Block volumes, object storage
│   └── dns/                   # DNS records
└── environments/
    ├── staging/
    └── production/
```

### Key Resources Provisioned

```hcl
# Oracle Cloud ARM VM (Free Tier)
resource "oci_core_instance" "k8s_control_plane" {
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  compartment_id      = var.compartment_id
  display_name        = "promptforge-control-plane"

  shape = "VM.Standard.A1.Flex"  # Free ARM instance
  shape_config {
    ocpus         = 2
    memory_in_gbs = 12
  }

  source_details {
    source_type = "image"
    source_id   = data.oci_core_images.ubuntu_22.images[0].id
  }

  metadata = {
    user_data = base64encode(file("${path.module}/cloud-init/k8s-control.yaml"))
    ssh_authorized_keys = var.ssh_public_key
  }
}

# Worker Nodes (x2, free tier)
resource "oci_core_instance" "k8s_workers" {
  count               = 2
  display_name        = "promptforge-worker-${count.index}"
  shape               = "VM.Standard.A1.Flex"
  shape_config {
    ocpus         = 1
    memory_in_gbs = 6
  }
  # ... same source config
}

# Virtual Cloud Network
resource "oci_core_vcn" "promptforge_vcn" {
  compartment_id = var.compartment_id
  cidr_block     = "10.0.0.0/16"
  display_name   = "promptforge-vcn"
}

# Security Group for K8s
resource "oci_core_security_list" "k8s_security_list" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.promptforge_vcn.id

  ingress_security_rules {
    protocol = "6"  # TCP
    source   = "0.0.0.0/0"
    tcp_options { max = 443; min = 443 }   # HTTPS
  }
  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options { max = 80; min = 80 }     # HTTP (redirect)
  }
  ingress_security_rules {
    protocol = "6"
    source   = "10.0.0.0/16"              # Internal K8s traffic
    tcp_options { max = 6443; min = 6443 } # API server
  }
}

# Object Storage Bucket (prompt exports, uploads)
resource "oci_objectstorage_bucket" "promptforge_storage" {
  compartment_id = var.compartment_id
  namespace      = data.oci_objectstorage_namespace.storage.namespace
  name           = "promptforge-uploads"
  access_type    = "NoPublicAccess"
}
```

### Terraform Workflow

```bash
# Initialize
terraform init

# Plan (preview changes)
terraform plan -var-file="environments/production/terraform.tfvars"

# Apply (provision)
terraform apply -auto-approve -var-file="environments/production/terraform.tfvars"

# Destroy (teardown)
terraform destroy -var-file="environments/production/terraform.tfvars"
```

---

## 12. Configuration Management (Ansible)

After Terraform provisions VMs, Ansible configures them.

### Playbook Structure

```
ansible/
├── inventory/
│   ├── production.ini         # Production host inventory
│   └── staging.ini            # Staging host inventory
├── group_vars/
│   ├── all.yml                # Variables for all hosts
│   ├── control_plane.yml      # K8s control plane vars
│   └── workers.yml            # Worker node vars
├── roles/
│   ├── common/                # Base OS config
│   ├── docker/                # Docker install & config
│   ├── k3s_control/           # K3s control plane install
│   ├── k3s_worker/            # K3s worker join
│   ├── helm/                  # Helm install
│   ├── monitoring/            # Prometheus + Grafana
│   └── security/              # Firewall, SSH hardening
└── playbooks/
    ├── site.yml               # Master playbook
    ├── k8s_setup.yml          # K8s cluster bootstrap
    ├── deploy_services.yml    # Deploy all services
    └── rolling_update.yml     # Zero-downtime update
```

### Master Playbook (`site.yml`)

```yaml
---
- name: Configure all hosts
  hosts: all
  become: yes
  roles:
    - common
    - security

- name: Install Docker
  hosts: all
  become: yes
  roles:
    - docker

- name: Setup K3s Control Plane
  hosts: control_plane
  become: yes
  roles:
    - k3s_control
    - helm

- name: Join Worker Nodes
  hosts: workers
  become: yes
  roles:
    - k3s_worker

- name: Deploy Monitoring Stack
  hosts: control_plane
  become: yes
  roles:
    - monitoring
```

### Key Ansible Tasks

```yaml
# roles/k3s_control/tasks/main.yml
- name: Download K3s install script
  get_url:
    url: https://get.k3s.io
    dest: /tmp/k3s_install.sh
    mode: '0755'

- name: Install K3s control plane
  shell: /tmp/k3s_install.sh
  environment:
    INSTALL_K3S_EXEC: "server --disable traefik --write-kubeconfig-mode 644"
  creates: /usr/local/bin/k3s

- name: Wait for K3s to be ready
  wait_for:
    port: 6443
    host: "{{ ansible_default_ipv4.address }}"
    timeout: 120

- name: Get K3s node token
  slurp:
    src: /var/lib/rancher/k3s/server/node-token
  register: k3s_token

- name: Save token to control vars
  set_fact:
    k3s_node_token: "{{ k3s_token.content | b64decode | trim }}"

# roles/docker/tasks/main.yml
- name: Add Docker apt key
  apt_key:
    url: https://download.docker.com/linux/ubuntu/gpg
    state: present

- name: Add Docker repository
  apt_repository:
    repo: "deb [arch=arm64] https://download.docker.com/linux/ubuntu {{ ansible_distribution_release }} stable"

- name: Install Docker
  apt:
    name:
      - docker-ce
      - docker-ce-cli
      - containerd.io
    state: present
    update_cache: yes

- name: Add user to docker group
  user:
    name: ubuntu
    groups: docker
    append: yes
```

---

## 13. Kubernetes Orchestration

All microservices run in a **K3s Kubernetes cluster** with full GitOps-managed configuration.

### Namespace Structure

```
promptforge-prod       # Production services
promptforge-staging    # Staging services
monitoring             # Prometheus, Grafana, Loki
ingress-nginx          # NGINX Ingress Controller
cert-manager           # TLS certificate management
```

### Helm Chart Structure

```
helm/
└── promptforge/
    ├── Chart.yaml
    ├── values.yaml                    # Default values
    ├── values-production.yaml         # Production overrides
    ├── values-staging.yaml            # Staging overrides
    └── templates/
        ├── _helpers.tpl
        ├── auth-service/
        │   ├── deployment.yaml
        │   ├── service.yaml
        │   └── hpa.yaml
        ├── prompt-service/
        │   ├── deployment.yaml
        │   ├── service.yaml
        │   └── hpa.yaml
        ├── ... (one folder per microservice)
        ├── ingress.yaml
        ├── configmap.yaml
        └── secrets.yaml
```

### Sample Deployment Manifest

```yaml
# helm/promptforge/templates/prompt-service/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prompt-service
  namespace: {{ .Values.namespace }}
  labels:
    app: prompt-service
    version: {{ .Values.promptService.image.tag }}
spec:
  replicas: {{ .Values.promptService.replicas }}
  selector:
    matchLabels:
      app: prompt-service
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0        # Zero-downtime deployments
  template:
    metadata:
      labels:
        app: prompt-service
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/metrics"
    spec:
      containers:
        - name: prompt-service
          image: ghcr.io/yourusername/prompt-service:{{ .Values.promptService.image.tag }}
          imagePullPolicy: Always
          ports:
            - containerPort: 3000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: promptforge-secrets
                  key: database-url
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: promptforge-secrets
                  key: redis-url
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health/live
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 5
            failureThreshold: 3
          startupProbe:
            httpGet:
              path: /health/startup
              port: 3000
            failureThreshold: 30
            periodSeconds: 10
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchExpressions:
                    - key: app
                      operator: In
                      values: [prompt-service]
                topologyKey: kubernetes.io/hostname
```

### Horizontal Pod Autoscaler

```yaml
# helm/promptforge/templates/prompt-service/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: prompt-service-hpa
  namespace: {{ .Values.namespace }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: prompt-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

### Ingress with TLS

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: promptforge-ingress
  namespace: promptforge-prod
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/rate-limit: "100"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - promptforge.dev
      secretName: promptforge-tls
  rules:
    - host: promptforge.dev
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: kong-proxy
                port:
                  number: 8000
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 3000
```

---

## 14. CI/CD Pipeline (GitHub Actions)

### Complete Workflow File

```yaml
# .github/workflows/main.yml
name: PromptForge CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_PREFIX: ghcr.io/${{ github.repository_owner }}/promptforge

jobs:
  # ─────────────────────────────────────────
  # STAGE 1: Code Quality
  # ─────────────────────────────────────────
  quality:
    name: Code Quality & Lint
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [auth, prompt, playground, ai-execution, search, analytics, notification, marketplace, user]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: services/${{ matrix.service }}/package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: services/${{ matrix.service }}

      - name: Run ESLint
        run: npm run lint
        working-directory: services/${{ matrix.service }}

      - name: TypeScript type check
        run: npm run type-check
        working-directory: services/${{ matrix.service }}

  # ─────────────────────────────────────────
  # STAGE 2: Tests
  # ─────────────────────────────────────────
  test:
    name: Tests
    runs-on: ubuntu-latest
    needs: quality
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: promptforge_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-retries 5
      redis:
        image: redis:7-alpine
        options: --health-cmd "redis-cli ping" --health-interval 10s
    strategy:
      matrix:
        service: [auth, prompt, playground, ai-execution, search, analytics]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: services/${{ matrix.service }}/package-lock.json

      - name: Install & Run Unit Tests
        run: |
          npm ci
          npm run test:cov
        working-directory: services/${{ matrix.service }}
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/promptforge_test
          REDIS_URL: redis://localhost:6379

      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          flags: ${{ matrix.service }}

  # ─────────────────────────────────────────
  # STAGE 3: Build Docker Images
  # ─────────────────────────────────────────
  build:
    name: Build & Push Docker Images
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name == 'push'
    strategy:
      matrix:
        service: [auth, prompt, playground, ai-execution, search, analytics, notification, marketplace, user, frontend]
    steps:
      - uses: actions/checkout@v4

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Extract Docker metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.IMAGE_PREFIX }}-${{ matrix.service }}
          tags: |
            type=sha,prefix={{branch}}-
            type=ref,event=branch
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: services/${{ matrix.service }}
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ─────────────────────────────────────────
  # STAGE 4: Security Scanning
  # ─────────────────────────────────────────
  security-scan:
    name: Container Security Scan
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: '${{ env.IMAGE_PREFIX }}-prompt:latest'
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'

  # ─────────────────────────────────────────
  # STAGE 5: Deploy to Staging
  # ─────────────────────────────────────────
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [build, security-scan]
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - name: Setup Kubectl
        uses: azure/setup-kubectl@v3

      - name: Configure Kubeconfig
        run: |
          mkdir -p ~/.kube
          echo "${{ secrets.KUBECONFIG_STAGING }}" | base64 -d > ~/.kube/config

      - name: Deploy to Staging with Helm
        run: |
          helm upgrade --install promptforge-staging ./helm/promptforge \
            --namespace promptforge-staging \
            --create-namespace \
            --values helm/promptforge/values-staging.yaml \
            --set global.image.tag=${{ github.sha }} \
            --wait --timeout=5m

      - name: Run Smoke Tests
        run: |
          kubectl wait --for=condition=ready pod -l app=prompt-service \
            -n promptforge-staging --timeout=120s
          curl -f https://staging.promptforge.dev/api/health

  # ─────────────────────────────────────────
  # STAGE 6: Deploy to Production
  # ─────────────────────────────────────────
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: deploy-staging
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://promptforge.dev
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Production with Helm (Rolling Update)
        run: |
          helm upgrade --install promptforge ./helm/promptforge \
            --namespace promptforge-prod \
            --values helm/promptforge/values-production.yaml \
            --set global.image.tag=${{ github.sha }} \
            --wait --timeout=10m

      - name: Verify All Pods Healthy
        run: |
          kubectl rollout status deployment/prompt-service -n promptforge-prod
          kubectl rollout status deployment/auth-service -n promptforge-prod
          kubectl rollout status deployment/ai-execution-service -n promptforge-prod

      - name: Post Deploy Notification
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: "🚀 PromptForge deployed to production — commit ${{ github.sha }}"
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 15. Monitoring, Observability & Self-Healing

### Observability Stack (The Three Pillars)

```
Metrics  →  Prometheus  →  Grafana Dashboards
Logs     →  Loki        →  Grafana Log Explorer
Traces   →  Jaeger      →  Distributed Trace Viewer
```

### Prometheus Configuration

Each NestJS service exposes `/metrics` via `prom-client`:

```typescript
// Metrics collected per service
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5]
});

const activeConnections = new Gauge({
  name: 'active_websocket_connections',
  help: 'Number of active WebSocket connections'
});

const aiExecutionDuration = new Histogram({
  name: 'ai_execution_duration_seconds',
  help: 'AI API execution time',
  labelNames: ['model', 'provider']
});

const promptsCreatedTotal = new Counter({
  name: 'prompts_created_total',
  help: 'Total number of prompts created'
});
```

### Grafana Dashboards

**Dashboard 1: Platform Health**
- Request rate per service (requests/sec)
- Error rate (% 5xx responses)
- P99 latency per endpoint
- Active pod count per service

**Dashboard 2: AI Execution**
- Executions per minute
- Average latency per model
- Token usage over time
- Cost per hour (estimated)
- Queue depth (BullMQ jobs)

**Dashboard 3: Business Metrics**
- New users / day
- Active prompts
- Upvotes per hour
- Marketplace revenue

**Dashboard 4: Infrastructure**
- CPU usage per node
- Memory usage per pod
- Disk I/O
- Network throughput

### Health Check Endpoints

Every service implements three health check endpoints:

```typescript
// /health/live  — Is the process alive?
@Get('live')
liveness(): { status: string } {
  return { status: 'ok' };
}

// /health/ready  — Can the service handle traffic?
@Get('ready')
async readiness() {
  const dbOk = await this.db.$queryRaw`SELECT 1`;
  const redisOk = await this.redis.ping();
  if (!dbOk || redisOk !== 'PONG') throw new ServiceUnavailableException();
  return { status: 'ready', db: 'ok', cache: 'ok' };
}

// /health/startup  — Has the service finished starting?
@Get('startup')
async startup() {
  const migrationsDone = await this.db.$queryRaw`SELECT COUNT(*) FROM _prisma_migrations WHERE applied_steps_count > 0`;
  return { status: 'started', migrations: migrationsDone };
}
```

### Self-Healing Mechanisms

| Mechanism | How It Works |
|-----------|-------------|
| **Liveness Probe** | K8s restarts container if `/health/live` fails 3 times |
| **Readiness Probe** | K8s removes pod from load balancer if DB/Redis unreachable |
| **HPA** | Auto-scales pods up when CPU > 70% |
| **Pod Disruption Budget** | Ensures minimum 1 pod always running during maintenance |
| **Resource Limits** | Prevents one service from exhausting node memory |
| **Circuit Breaker** | Stops cascade failures when downstream service is slow |
| **Rolling Updates** | Zero-downtime deployments — old pods kept until new ones ready |
| **CronJob Health** | Scheduled K8s CronJob checks DB connection and clears stale cache |

---

## 16. Security Architecture

### Authentication & Authorization

- **JWT + Refresh Tokens**: Short-lived access tokens (15 min), long-lived refresh tokens (30 days) stored in httpOnly cookies
- **OAuth 2.0**: GitHub and Google sign-in via Passport.js
- **TOTP 2FA**: Optional two-factor authentication with authenticator apps
- **RBAC**: Role-based access control (User, Creator, Moderator, Admin)
- **API Key Authentication**: For developer API access with scoped permissions

### Network Security

- **TLS Everywhere**: All traffic encrypted via Let's Encrypt certificates managed by cert-manager
- **mTLS (Mutual TLS)**: Service-to-service communication authenticated via Istio (optional advanced setup)
- **CORS**: Strict CORS policy, only allowlisted origins
- **Rate Limiting**: Kong enforces per-IP and per-user rate limits
- **DDoS Protection**: Cloudflare in front of NGINX Ingress

### Secret Management

```yaml
# Kubernetes Secrets (base64-encoded, encrypted at rest)
apiVersion: v1
kind: Secret
metadata:
  name: promptforge-secrets
  namespace: promptforge-prod
type: Opaque
data:
  database-url: <base64>
  redis-url: <base64>
  openai-api-key: <base64>
  anthropic-api-key: <base64>
  jwt-secret: <base64>
  stripe-secret-key: <base64>
```

In production, secrets are managed via **HashiCorp Vault** or **Oracle Cloud Vault** instead of K8s native secrets.

### Input Validation & Security

- All inputs validated with `class-validator` before business logic
- SQL injection impossible via Prisma parameterized queries
- XSS prevention via DOMPurify on frontend
- CSRF tokens for all state-modifying requests
- Content Security Policy headers via NGINX
- Prompt inputs sanitized before AI API calls

---

## 17. Cloud Infrastructure

### Oracle Cloud Free Tier Setup

```
Oracle Cloud (Always-Free Resources)
├── Compute (ARM)
│   ├── k8s-control-plane     (2 OCPU, 12 GB RAM)
│   ├── k8s-worker-1          (1 OCPU,  6 GB RAM)
│   └── k8s-worker-2          (1 OCPU,  6 GB RAM)
│   Total: 4 OCPU, 24 GB RAM  ← completely free forever
│
├── Storage
│   ├── Block Volume: 100GB (control plane OS + K8s data)
│   ├── Block Volume: 50GB  (worker 1)
│   ├── Block Volume: 50GB  (worker 2)
│   └── Object Storage: 20GB (uploads, exports)
│
├── Networking
│   ├── VCN: 10.0.0.0/16
│   ├── Public Subnet: 10.0.1.0/24   (ingress, load balancer)
│   └── Private Subnet: 10.0.2.0/24  (services, DB)
│
└── Load Balancer: 10 Mbps (free)

External Free Services
├── Neon (PostgreSQL)      — free tier, 3GB storage
├── Upstash (Redis)        — free tier, 10K requests/day
├── GitHub Container Registry — free for public repos
└── Cloudflare             — free DDoS + CDN
```

### Cost Summary

| Resource | Provider | Cost |
|---------|---------|------|
| 3x ARM VM (4 OCPU, 24GB) | Oracle Cloud | **$0/month** |
| 200GB Block Storage | Oracle Cloud | **$0/month** |
| PostgreSQL (3GB) | Neon | **$0/month** |
| Redis (free tier) | Upstash | **$0/month** |
| Container Registry | GitHub | **$0/month** |
| CDN + DDoS | Cloudflare | **$0/month** |
| Domain (.dev) | Google Domains | ~$12/year |
| **Total** | | **~$1/month** |

---

## 18. Project Folder Structure

```
promptforge/
├── .github/
│   ├── workflows/
│   │   ├── main.yml               # Main CI/CD pipeline
│   │   ├── pr-checks.yml          # PR validation
│   │   └── security-scan.yml      # Weekly security scans
│   └── CODEOWNERS
│
├── services/
│   ├── auth-service/
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.module.ts
│   │   │   │   └── strategies/
│   │   │   │       ├── jwt.strategy.ts
│   │   │   │       ├── google.strategy.ts
│   │   │   │       └── github.strategy.ts
│   │   │   ├── users/
│   │   │   ├── health/
│   │   │   └── main.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── test/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── prompt-service/            # Same structure
│   ├── playground-service/
│   ├── ai-execution-service/
│   ├── search-service/
│   ├── analytics-service/
│   ├── notification-service/
│   ├── marketplace-service/
│   ├── user-service/
│   └── safety-service/            # Python FastAPI
│       ├── app/
│       │   ├── main.py
│       │   ├── classifiers/
│       │   └── models/
│       ├── Dockerfile
│       └── requirements.txt
│
├── frontend/
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   ├── playground/
│   │   ├── explore/
│   │   ├── arena/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                    # shadcn components
│   │   ├── three/                 # Three.js components
│   │   ├── prompt/
│   │   └── playground/
│   ├── lib/
│   ├── Dockerfile
│   └── package.json
│
├── infrastructure/
│   ├── terraform/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── modules/
│   ├── ansible/
│   │   ├── site.yml
│   │   ├── inventory/
│   │   └── roles/
│   └── kubernetes/
│       └── base/                  # Non-Helm K8s manifests
│
├── helm/
│   └── promptforge/
│       ├── Chart.yaml
│       ├── values.yaml
│       ├── values-production.yaml
│       ├── values-staging.yaml
│       └── templates/
│
├── docker-compose.yml             # Local dev environment
├── docker-compose.override.yml   # Dev overrides
├── Makefile                       # Developer shortcuts
└── README.md
```

---

## 19. API Specifications

### Auth Service (`/api/auth`)

| Method | Endpoint | Description |
|--------|---------|-------------|
| POST | `/register` | Create new account |
| POST | `/login` | Login, returns JWT |
| POST | `/refresh` | Refresh access token |
| POST | `/logout` | Invalidate refresh token |
| GET | `/oauth/google` | Google OAuth redirect |
| GET | `/oauth/github` | GitHub OAuth redirect |
| POST | `/2fa/enable` | Enable TOTP 2FA |
| POST | `/2fa/verify` | Verify 2FA code |

### Prompt Service (`/api/prompts`)

| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/` | List prompts (paginated, filtered) |
| POST | `/` | Create new prompt |
| GET | `/:id` | Get prompt by ID |
| PATCH | `/:id` | Update prompt metadata |
| DELETE | `/:id` | Soft-delete prompt |
| GET | `/:id/versions` | List all versions |
| POST | `/:id/versions` | Create new version |
| GET | `/:id/versions/:v` | Get specific version |
| POST | `/:id/fork` | Fork a prompt |
| POST | `/:id/upvote` | Toggle upvote |
| GET | `/:id/analytics` | Prompt analytics |

### AI Execution Service (`/api/execute`)

| Method | Endpoint | Description |
|--------|---------|-------------|
| POST | `/run` | Execute prompt (sync) |
| POST | `/stream` | Execute prompt (SSE stream) |
| POST | `/compare` | Compare multiple prompts |
| GET | `/models` | List available models |
| GET | `/history` | User's execution history |
| GET | `/history/:id` | Get single execution result |

### Search Service (`/api/search`)

| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/prompts?q=...` | Full-text prompt search |
| GET | `/prompts/semantic?q=...` | Semantic similarity search |
| GET | `/autocomplete?q=...` | Search autocomplete |
| GET | `/tags` | Popular tags |

---

## 20. Deployment Runbook

### Initial Setup (One-Time)

```bash
# 1. Clone and setup
git clone https://github.com/yourusername/promptforge.git
cd promptforge

# 2. Provision infrastructure
cd infrastructure/terraform
terraform init
terraform apply -var-file="environments/production/terraform.tfvars"

# 3. Configure servers
cd ../ansible
ansible-playbook -i inventory/production.ini playbooks/site.yml

# 4. Add secrets to GitHub
# (GitHub → Repo → Settings → Secrets)
# KUBECONFIG_PRODUCTION, KUBECONFIG_STAGING
# NEON_DATABASE_URL, UPSTASH_REDIS_URL, OPENAI_API_KEY, etc.

# 5. Push to main → GitHub Actions deploys automatically
git push origin main
```

### Local Development

```bash
# Start all services with Docker Compose
make dev

# Or start individual service
cd services/prompt-service && npm run start:dev

# Run tests
make test

# Build all Docker images
make build

# Access services
Frontend:        http://localhost:3000
API Gateway:     http://localhost:8000
Grafana:         http://localhost:3001 (admin/admin)
Prometheus:      http://localhost:9090
Meilisearch:     http://localhost:7700
```

### Makefile Shortcuts

```makefile
dev:         docker-compose up -d
test:        docker-compose run --rm test-runner npm test
build:       docker-compose build
push:        docker-compose push
deploy-stg:  helm upgrade --install ... --namespace staging
deploy-prod: helm upgrade --install ... --namespace production
rollback:    helm rollback promptforge -n promptforge-prod
logs:        kubectl logs -f -l app=prompt-service -n promptforge-prod
shell:       kubectl exec -it deploy/prompt-service -n promptforge-prod -- sh
```

---

## 21. Why This Project Is Exceptional

### Satisfies All Assignment Requirements

| Requirement | How PromptForge Satisfies It |
|-------------|------------------------------|
| DevOps-focused project title | ✅ "Cloud-Native AI Prompt Platform with Automated DevOps Deployment" |
| Web app (frontend + backend + DB) | ✅ Next.js frontend, 10x NestJS microservices, PostgreSQL + Redis + Meilisearch |
| Python/Node.js backend | ✅ All services in Node.js (NestJS), Safety Service in Python (FastAPI) |
| Microservices (not monolithic) | ✅ 10 independent services with their own DBs and containers |
| Git / GitHub version control | ✅ Monorepo on GitHub with branch protection, PRs, CODEOWNERS |
| Docker containerization | ✅ Every service has its own optimized multi-stage Dockerfile |
| CI/CD pipeline | ✅ GitHub Actions: lint → test → build → security scan → deploy staging → deploy prod |
| Terraform (IaC) | ✅ Full Oracle Cloud infrastructure provisioned via Terraform modules |
| Ansible (config management) | ✅ K3s install, Docker setup, monitoring config via Ansible playbooks |
| Kubernetes deployment | ✅ Helm charts, rolling updates, namespaces, HPA, NGINX Ingress |
| Clustering & scalability | ✅ 3-node K3s cluster, HPA scales 2–10 pods, load balancer |
| Monitoring & health checks | ✅ Prometheus + Grafana, liveness/readiness/startup probes |
| Self-healing | ✅ K8s auto-restarts on probe failure, circuit breakers, Pod Disruption Budgets |

### What Makes This Stand Out

This is not a toy project. PromptForge is designed to a **production engineering standard**:

- **Real-world domain**: AI prompt engineering is one of the most in-demand developer skills in 2025
- **Full-stack complexity**: Covers frontend (3D/WebGL), backend (distributed systems), databases (relational + vector + time-series + search), and infrastructure
- **10 microservices**: More than most portfolios will show in an entire career
- **Zero-cost infrastructure**: Runs entirely free on Oracle Cloud + free-tier databases — demonstrable and reproducible
- **End-to-end DevOps**: From `git push` to live production pods via an automated pipeline — no manual steps
- **Advanced features**: Semantic search, RAG integration, real-time battle arena, marketplace with payments
- **Demo-ready**: Anyone can visit the live URL, create an account, run a prompt, compare models, and see the result in seconds

---

*Built with ❤️ using Node.js, NestJS, Next.js, Docker, Kubernetes, Terraform, Ansible, GitHub Actions, and more — because DevOps is not a department, it's a culture.*
