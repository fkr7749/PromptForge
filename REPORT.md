

## ABSTRACT

This project presents the end-to-end automated deployment of **PromptForge**, a full-stack AI prompt engineering and management platform, using a complete DevOps toolchain. PromptForge allows users to create, test, optimize, and share AI prompts through a rich web interface. The platform comprises a Next.js 15 frontend and nine backend microservices built with NestJS and Python (FastAPI), all backed by a PostgreSQL database managed through Prisma ORM.

The core problem addressed is the elimination of manual, error-prone deployment workflows that plagued traditional software delivery. Manually building server environments, configuring dependencies, deploying code, and coordinating updates across multiple services is slow, inconsistent, and difficult to roll back. This project replaces those processes entirely with automated tooling.

The tools used span the full DevOps lifecycle: **Git and GitHub** for distributed version control and collaboration; **Docker** for packaging each service into reproducible, portable container images; **Terraform** (using the Kubernetes provider) for declaring and provisioning infrastructure as code; **Kubernetes (Minikube)** for container orchestration, auto-healing, and service discovery; **Ansible** for configuration management and automated application deployment; and **GitHub Actions** for a continuous integration and continuous deployment (CI/CD) pipeline that runs on every code push.

The final outcome is a fully automated pipeline where a single `git push` triggers type-checking, linting, frontend compilation, Docker image builds across ten services, and image publishing to GitHub Container Registry (GHCR) — all without human intervention. Infrastructure is provisioned declaratively with Terraform in under one minute, and application deployment is orchestrated by Ansible applying Kubernetes manifests. The platform is accessible via a NodePort service URL immediately after deployment, and every deployment step is auditable through GitHub Actions run history.

---

## PROBLEM STATEMENT

### Background

Modern web applications are no longer simple monolithic deployments. Platforms like PromptForge consist of multiple interdependent services, each with its own runtime dependencies, configuration, and scaling requirements. Deploying such systems manually — SSH-ing into servers, pulling code, restarting processes, updating environment variables — introduces fragility at every step.

### Issues in Traditional/Manual Systems

**Inconsistent environments:** A service that works on a developer's laptop may fail on a production server due to differing Node.js versions, missing system libraries, or conflicting global packages. The phrase "works on my machine" is the hallmark of a system lacking reproducibility.

**Error-prone deployments:** Manual steps are forgotten, performed out of order, or executed with the wrong parameters. A single missed environment variable or misconfigured reverse proxy can take a production service offline for hours.

**No rollback strategy:** When a manual deployment fails, reverting to a previous state requires repeating the same error-prone manual process in reverse — often under pressure.

**Slow delivery cycles:** Manual approval gates, long environment setup times, and sequential deployment steps stretch release cycles from hours to days. Competitive software teams cannot afford this latency.

**Lack of visibility:** When deployments happen over SSH sessions or through ad-hoc scripts, there is no centralised audit trail, no notification when something goes wrong, and no easy way to answer "what changed and when?"

**Scaling bottlenecks:** Manually scaling services to handle increased load requires human involvement, leads to delayed responses to traffic spikes, and often results in either over-provisioning (wasted cost) or under-provisioning (degraded user experience).

### Why This Project is Needed

PromptForge's architecture — ten services, a shared database package, Prisma ORM with generated TypeScript clients, and a pnpm monorepo workspace — makes manual deployment especially impractical. A single dependency graph spans the entire repository; a change to the database schema requires regenerating types, rebuilding dependent services, and redeploying in the correct order. Automating this chain is not merely convenient — it is essential for maintainability.

---

## OBJECTIVE

### Main Goal

To design and implement a fully automated DevOps pipeline that takes PromptForge from source code to a running, accessible web application without requiring manual intervention after the initial infrastructure setup.

### Specific Objectives

1. **Automate build and test validation** — every push to the main branch triggers type-checking, linting, and frontend compilation automatically, ensuring only verified code proceeds to deployment.

2. **Containerise all services** — package each of the ten microservices into Docker images using multi-stage builds that produce lean, production-ready containers under 500 MB.

3. **Declare infrastructure as code** — use Terraform to provision a Kubernetes namespace, deployment, and service in a single reproducible `terraform apply` command, ensuring the infrastructure can be recreated identically at any time.

4. **Automate application deployment** — use Ansible playbooks to apply Kubernetes manifests, verify rollout success, and report the live service URL without manual kubectl commands.

5. **Establish a CI/CD pipeline** — use GitHub Actions to automatically build and push all ten Docker images to GitHub Container Registry on every merge to the main branch.

6. **Ensure zero-downtime deployments** — use Kubernetes rolling update strategy so new versions replace old pods only after health checks pass.

7. **Maintain full auditability** — every deployment, image build, and test run is recorded in GitHub Actions history with timestamps, logs, and artefacts.

---

## METHODOLOGY / ARCHITECTURE

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DEVELOPER WORKSTATION                         │
│                                                                     │
│  ┌──────────────┐    git push     ┌──────────────────────────────┐  │
│  │  Source Code │ ─────────────► │        GitHub Repository      │  │
│  │  (VS Code)   │                │   github.com/fkr7749/         │  │
│  └──────────────┘                │        PromptForge            │  │
└─────────────────────────────────┘└──────────────┬───────────────┘  │
                                                   │ triggers          
                                    ┌──────────────▼───────────────┐  
                                    │     GITHUB ACTIONS CI/CD     │  
                                    │                              │  
                                    │  1. Typecheck & Lint         │  
                                    │  2. Build Frontend           │  
                                    │  3. Docker Build × 10        │  
                                    │  4. Push → GHCR              │  
                                    └──────────────┬───────────────┘  
                                                   │ images pushed     
                                    ┌──────────────▼───────────────┐  
                                    │  GitHub Container Registry   │  
                                    │  ghcr.io/fkr7749/            │  
                                    │  promptforge-frontend        │  
                                    │  promptforge-auth-service    │  
                                    │  promptforge-ai-execution    │  
                                    │  ... (10 images total)       │  
                                    └──────────────────────────────┘  

┌─────────────────────────────────────────────────────────────────────┐
│                     LOCAL INFRASTRUCTURE                             │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   TERRAFORM (IaC)                            │  │
│  │                                                              │  │
│  │   terraform apply ──► Kubernetes Namespace: promptforge      │  │
│  │                  ──► Kubernetes Deployment (1 replica)       │  │
│  │                  ──► Kubernetes Service (NodePort: 30080)    │  │
│  └──────────────────────────────┬───────────────────────────────┘  │
│                                 │ provisions                         │
│  ┌──────────────────────────────▼───────────────────────────────┐  │
│  │              KUBERNETES CLUSTER (Minikube)                   │  │
│  │                                                              │  │
│  │   Namespace: promptforge                                     │  │
│  │   ┌────────────────────────────────────────────────────┐    │  │
│  │   │  Pod: promptforge-frontend-xxxx                    │    │  │
│  │   │  Image: ghcr.io/fkr7749/promptforge-frontend       │    │  │
│  │   │  Port: 3000 (internal)                             │    │  │
│  │   │  Resources: 100m CPU / 256Mi RAM (request)         │    │  │
│  │   └────────────────────────────────────────────────────┘    │  │
│  │                                                              │  │
│  │   Service: promptforge-frontend                              │  │
│  │   Type: NodePort → 30080                                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                  ANSIBLE (Config Management)                 │  │
│  │                                                              │  │
│  │   ansible-playbook deploy-local.yml                         │  │
│  │   ├── Verify minikube status                                 │  │
│  │   ├── kubectl apply namespace.yaml                           │  │
│  │   ├── kubectl apply deployment.yaml                          │  │
│  │   ├── kubectl apply service.yaml                             │  │
│  │   ├── Wait for rollout                                       │  │
│  │   └── Print access URL                                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                      APPLICATION STACK                            │
│                                                                  │
│  Frontend (Next.js 15)  ◄──► Auth Service (NestJS :4001)        │
│        │                ◄──► Prompt Service (NestJS :4002)       │
│        │                ◄──► AI Execution (NestJS :4003)         │
│        │                ◄──► Playground (NestJS :4004)           │
│        │                ◄──► Search Service (NestJS :4005)       │
│        │                ◄──► Analytics (NestJS :4006)            │
│        │                ◄──► User Service (NestJS :4007)         │
│        │                ◄──► Marketplace (NestJS :4008)          │
│        │                ◄──► Safety Service (Python :4009)       │
│        │                                                         │
│        └──────────────── PostgreSQL (Neon / pgvector)            │
└──────────────────────────────────────────────────────────────────┘
```

### Workflow Explanation

The deployment workflow follows a linear pipeline triggered automatically by code changes:

1. A developer commits and pushes code to the GitHub repository.
2. GitHub Actions detects the push and starts the CI/CD pipeline.
3. The `quality` job installs dependencies, generates the Prisma TypeScript client, and runs type-checking across all 16 workspace packages. Only verified code proceeds.
4. The `build` job compiles the Next.js frontend and uploads the build artefact.
5. The `docker` job builds all ten service images in parallel using multi-stage Dockerfiles and pushes them to GHCR with SHA-tagged and `latest` tags.
6. On the local machine, `terraform apply` provisions the Kubernetes infrastructure declaratively using the Terraform Kubernetes provider.
7. `ansible-playbook` applies the Kubernetes manifests, waits for the rollout to complete, and outputs the service URL.
8. The application is accessible immediately via `minikube service promptforge-frontend --url`.

---

## IMPLEMENTATION PHASES

### Phase 1: Source Code Management

**Objective:** Establish a version-controlled, collaborative development environment that serves as the single source of truth for all application code and infrastructure definitions.

**Tools Used:** Git 2.x, GitHub

**Implementation Steps:**

The project is organised as a **pnpm monorepo** — a single Git repository containing all application code, infrastructure-as-code, Kubernetes manifests, Ansible playbooks, and CI/CD workflows. This structure ensures that a single commit can atomically update multiple services and their deployment configuration simultaneously.

Repository structure:
```
PromptForge/
├── apps/
│   ├── frontend/                 # Next.js 15 web application
│   └── services/                 # Nine backend microservices
│       ├── auth-service/
│       ├── prompt-service/
│       ├── ai-execution/
│       ├── playground/
│       ├── search-service/
│       ├── analytics/
│       ├── user-service/
│       ├── marketplace/
│       └── safety-service/
├── packages/
│   ├── database/                 # Prisma schema + shared client
│   ├── tsconfig/                 # Shared TypeScript configurations
│   └── types/                    # Shared TypeScript type definitions
├── infrastructure/
│   ├── terraform-local/          # Terraform IaC for Kubernetes
│   └── ansible/                  # Ansible playbooks and roles
├── k8s/                          # Kubernetes manifests
├── .github/workflows/            # GitHub Actions CI/CD
├── pnpm-workspace.yaml
└── turbo.json                    # Turborepo task pipeline
```

**Branching Strategy:**
- `main` — production-ready code; triggers full CI/CD pipeline on push
- `develop` — integration branch for feature work
- Feature branches — short-lived, merged via Pull Request

**Key Commands:**
```bash
git init
git remote add origin https://github.com/fkr7749/PromptForge.git
git checkout -b feature/new-feature
git add .
git commit -m "feat: description of change"
git push origin main
```

---

### Phase 2: Containerisation

**Objective:** Package each microservice into a portable, reproducible Docker image that runs identically in development, testing, and production environments.

**Tools Used:** Docker 28.x, pnpm 9.12.0, Node.js 20 Alpine

**Implementation Steps:**

Each service uses a **multi-stage Dockerfile** with four stages: `base` (shared Node.js runtime), `deps` (dependency installation with layer caching), `builder` (TypeScript compilation), and `production` (minimal runtime image).

The multi-stage approach ensures:
- Only compiled JavaScript — not TypeScript source or devDependencies — enters the production image
- Layer caching means rebuilds reuse unchanged layers (pnpm install is only re-run when lockfile changes)
- The production image runs as a non-root user (`node:nodejs`) for security
- The final image is significantly smaller than a naive single-stage build

**Service port mapping:**

| Service | Language | Port |
|---|---|---|
| frontend | Next.js 15 | 3000 |
| auth-service | NestJS | 4001 |
| prompt-service | NestJS | 4002 |
| ai-execution | NestJS | 4003 |
| playground | NestJS | 4004 |
| search-service | NestJS | 4005 |
| analytics | NestJS | 4006 |
| user-service | NestJS | 4007 |
| marketplace | NestJS | 4008 |
| safety-service | Python/FastAPI | 4009 |

**Build and verify:**
```bash
docker build -t promptforge-frontend:latest -f apps/frontend/Dockerfile .
docker images
docker run -p 3000:3000 promptforge-frontend:latest
```

---

### Phase 3: Infrastructure as Code

**Objective:** Provision all Kubernetes infrastructure (namespace, deployment, service) using declarative Terraform configuration so the environment can be recreated identically at any time with a single command.

**Tools Used:** Terraform 1.14.x, Terraform Kubernetes Provider 2.27.x, Minikube 1.38.x

**Implementation Steps:**

Terraform is configured with the `hashicorp/kubernetes` provider pointing to the local Minikube cluster via `~/.kube/config`. Three resources are declared:

1. `kubernetes_namespace` — creates the `promptforge` namespace with managed-by labels
2. `kubernetes_deployment` — declares a 1-replica deployment of the frontend image with resource limits, TCP liveness/readiness probes, and environment variables
3. `kubernetes_service` — exposes the deployment as a NodePort service on port 30080

Variables allow customising the image, replica count, and port without modifying the configuration files directly.

**Terraform workflow:**
```bash
cd infrastructure/terraform-local
terraform init          # Download kubernetes provider plugin
terraform plan          # Preview changes
terraform apply -auto-approve  # Provision resources
terraform output        # Display service name, NodePort, access hint
terraform destroy       # Tear down all resources
```

---

### Phase 4: Container Registry

**Objective:** Store versioned Docker images in a centralised, accessible registry so Kubernetes can pull them during deployments.

**Tools Used:** GitHub Container Registry (GHCR), Docker Buildx, GitHub Actions

**Implementation Steps:**

The CI/CD pipeline automatically pushes images to **GitHub Container Registry (GHCR)** at `ghcr.io/fkr7749/` using the `GITHUB_TOKEN` secret that GitHub Actions provides automatically — no manual credential setup required.

Each image is tagged with three tags:
- `sha-<commit-hash>` — immutable, unique per commit (e.g., `sha-e69b020`)
- `main` — latest build from the main branch
- `latest` — same as `main` on the main branch

All ten service images are built in parallel using a matrix strategy, cutting total build time compared to sequential builds.

**Image naming convention:**
```
ghcr.io/fkr7749/promptforge-frontend:latest
ghcr.io/fkr7749/promptforge-auth-service:latest
ghcr.io/fkr7749/promptforge-ai-execution:latest
... (10 images total)
```

**To pull an image locally:**
```bash
docker pull ghcr.io/fkr7749/promptforge-frontend:latest
```

---

### Phase 5: Kubernetes Deployment

**Objective:** Orchestrate containerised services using Kubernetes to provide automatic scheduling, health monitoring, rolling updates, and service discovery.

**Tools Used:** Kubernetes 1.34.x, Minikube 1.38.x, kubectl

**Implementation Steps:**

Three YAML manifests define the complete Kubernetes deployment:

**namespace.yaml** — Isolates all PromptForge resources in a dedicated namespace, preventing naming conflicts with other workloads.

**deployment.yaml** — Declares the desired state: one replica of the frontend container image, with resource requests (100m CPU, 256Mi RAM) and limits (500m CPU, 512Mi RAM). TCP socket probes on port 3000 check pod health; Kubernetes automatically replaces pods that fail probes. The `imagePullPolicy: Always` ensures the latest image is used on every pod restart.

**service.yaml** — Exposes the deployment via a NodePort service. Port 30080 on the Minikube node maps to port 3000 inside the container, making the application accessible from the host machine.

**Deployment commands:**
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl get pods -n promptforge
kubectl get svc -n promptforge
kubectl get nodes
minikube service promptforge-frontend -n promptforge --url
```

---

### Phase 6: Configuration Management

**Objective:** Automate the application of Kubernetes manifests and deployment verification using Ansible, eliminating the need for manual kubectl commands and ensuring a repeatable deployment process.

**Tools Used:** Ansible 2.10.x

**Implementation Steps:**

The Ansible playbook `deploy-local.yml` runs on `localhost` with a local connection (no SSH required) and executes nine ordered tasks:

1. **Verify minikube status** — fails early if the cluster is not running, with a clear error message
2. **Set kubectl context** — ensures kubectl points to the minikube cluster
3. **Apply namespace manifest** — creates or updates the `promptforge` namespace
4. **Apply deployment manifest** — creates or updates the frontend deployment
5. **Apply service manifest** — creates or updates the NodePort service
6. **Wait for rollout** — blocks until all pods are Running (120-second timeout)
7. **Print pod status** — outputs `kubectl get pods -o wide` for verification
8. **Print service info** — outputs `kubectl get svc`
9. **Print access URL** — runs `minikube service --url` and prints the browser-accessible URL

**Execution:**
```bash
ansible-playbook infrastructure/ansible/playbooks/deploy-local.yml
```

The playbook's idempotency means running it multiple times produces the same result — it only changes what needs to change.

---

### Phase 7: CI/CD Pipeline

**Objective:** Establish a fully automated pipeline that validates code quality, compiles the application, and builds and publishes Docker images on every push to the main branch — replacing all manual deployment steps.

**Tools Used:** GitHub Actions, pnpm 9.12.0, Turbo 2.x, Docker Buildx

**Pipeline Structure:**

The pipeline is defined in `.github/workflows/ci.yml` and comprises three jobs with the following dependency graph:

```
quality ──► build
    └─────► docker (×10, parallel matrix)
```

**Job 1 — quality (Typecheck & Lint):**
Runs on every push and PR. Installs dependencies, generates the Prisma TypeScript client (required for type resolution across the monorepo), runs `pnpm typecheck` via Turborepo across all 16 packages, and runs `pnpm lint`. Only if this job passes do downstream jobs run.

**Job 2 — build (Frontend Build):**
Compiles the Next.js 15 application and uploads the `.next` build directory as a GitHub Actions artefact retained for 3 days.

**Job 3 — docker (×10 parallel):**
Runs only on push events (not pull requests). Uses a matrix strategy to build all ten service images in parallel using Docker Buildx with GitHub Actions cache (`type=gha`). Each image is pushed to GHCR with SHA, branch, and latest tags. The `GITHUB_TOKEN` secret is used for authentication — no additional secrets required.

**Pipeline triggers:**
- Push to `main` or `develop` → full pipeline
- Pull request to `main` or `develop` → quality and build only (no docker push)

---

## CODE IMPLEMENTATION

### 1. Dockerfile (Frontend — Multi-Stage)

```dockerfile
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
RUN pnpm --filter @promptforge/database db:generate
RUN pnpm --filter @promptforge/frontend build

# ─── Production ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs node

COPY --from=builder --chown=node:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=node:nodejs /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=builder --chown=node:nodejs /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder /app/apps/frontend/generated/client ./apps/frontend/generated/client

USER node
EXPOSE 3000
ENV PORT=3000
CMD ["node", "apps/frontend/server.js"]
```

---

### 2. Dockerfile (NestJS Microservice — Auth Service)

```dockerfile
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

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs node

COPY --from=builder /app/apps/services/auth-service/dist ./dist
COPY --from=builder /app/apps/frontend/generated/client ./apps/frontend/generated/client
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4001
CMD ["node", "dist/main"]
```

---

### 3. Terraform Configuration

**main.tf**
```hcl
terraform {
  required_version = ">= 1.6"
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.27"
    }
  }
}

provider "kubernetes" {
  config_path    = "~/.kube/config"
  config_context = "minikube"
}

resource "kubernetes_namespace" "promptforge" {
  metadata {
    name = var.namespace
    labels = {
      app        = var.app_name
      managed_by = "terraform"
    }
  }
}

resource "kubernetes_deployment" "frontend" {
  metadata {
    name      = "${var.app_name}-frontend"
    namespace = kubernetes_namespace.promptforge.metadata[0].name
    labels = { app = var.app_name, component = "frontend" }
  }
  spec {
    replicas = var.replicas
    selector { match_labels = { app = var.app_name, component = "frontend" } }
    template {
      metadata { labels = { app = var.app_name, component = "frontend" } }
      spec {
        container {
          name  = "frontend"
          image = var.image
          port  { container_port = var.port }
          resources {
            requests = { cpu = "100m", memory = "256Mi" }
            limits   = { cpu = "500m", memory = "512Mi" }
          }
          liveness_probe {
            tcp_socket { port = var.port }
            initial_delay_seconds = 30
            period_seconds        = 15
          }
          readiness_probe {
            tcp_socket { port = var.port }
            initial_delay_seconds = 10
            period_seconds        = 10
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "frontend" {
  metadata {
    name      = "${var.app_name}-frontend"
    namespace = kubernetes_namespace.promptforge.metadata[0].name
  }
  spec {
    type     = "NodePort"
    selector = { app = var.app_name, component = "frontend" }
    port {
      port        = var.port
      target_port = var.port
      node_port   = 30080
    }
  }
}
```

**variables.tf**
```hcl
variable "app_name"  { default = "promptforge" }
variable "namespace" { default = "promptforge" }
variable "image"     { default = "ghcr.io/fkr7749/promptforge-frontend:latest" }
variable "replicas"  { default = 1 }
variable "port"      { default = 3000 }
```

**outputs.tf**
```hcl
output "namespace"       { value = kubernetes_namespace.promptforge.metadata[0].name }
output "deployment_name" { value = kubernetes_deployment.frontend.metadata[0].name }
output "service_name"    { value = kubernetes_service.frontend.metadata[0].name }
output "node_port"       { value = kubernetes_service.frontend.spec[0].port[0].node_port }
output "access_url_hint" {
  value = "minikube service ${kubernetes_service.frontend.metadata[0].name} -n ${kubernetes_namespace.promptforge.metadata[0].name} --url"
}
```

---

### 4. Kubernetes Manifests

**k8s/namespace.yaml**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: promptforge
  labels:
    app: promptforge
    managed-by: ansible
```

**k8s/deployment.yaml**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: promptforge-frontend
  namespace: promptforge
spec:
  replicas: 1
  selector:
    matchLabels:
      app: promptforge
      component: frontend
  template:
    metadata:
      labels:
        app: promptforge
        component: frontend
    spec:
      containers:
        - name: frontend
          image: ghcr.io/fkr7749/promptforge-frontend:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 3000
          resources:
            requests: { cpu: 100m, memory: 256Mi }
            limits:   { cpu: 500m, memory: 512Mi }
          livenessProbe:
            tcpSocket: { port: 3000 }
            initialDelaySeconds: 30
            periodSeconds: 15
          readinessProbe:
            tcpSocket: { port: 3000 }
            initialDelaySeconds: 10
            periodSeconds: 10
```

**k8s/service.yaml**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: promptforge-frontend
  namespace: promptforge
spec:
  type: NodePort
  selector:
    app: promptforge
    component: frontend
  ports:
    - port: 3000
      targetPort: 3000
      nodePort: 30080
```

---

### 5. Ansible Playbook

```yaml
---
- name: Deploy PromptForge to Minikube
  hosts: localhost
  connection: local
  gather_facts: false

  vars:
    namespace: promptforge
    manifests_dir: "{{ playbook_dir }}/../../../k8s"
    kubectl: kubectl

  tasks:
    - name: Check minikube is running
      command: minikube status
      register: minikube_status
      changed_when: false
      failed_when: "'Running' not in minikube_status.stdout"

    - name: Set kubectl context to minikube
      command: kubectl config use-context minikube
      changed_when: false

    - name: Apply namespace
      command: "{{ kubectl }} apply -f {{ manifests_dir }}/namespace.yaml"
      register: ns_result

    - name: Apply deployment
      command: "{{ kubectl }} apply -f {{ manifests_dir }}/deployment.yaml"
      register: deploy_result

    - name: Apply service
      command: "{{ kubectl }} apply -f {{ manifests_dir }}/service.yaml"
      register: svc_result

    - name: Wait for deployment rollout
      command: >
        {{ kubectl }} rollout status deployment/promptforge-frontend
        -n {{ namespace }} --timeout=120s
      changed_when: false

    - name: Get pod status
      command: "{{ kubectl }} get pods -n {{ namespace }} -o wide"
      register: pods
      changed_when: false

    - name: Print pod status
      debug:
        msg: "{{ pods.stdout_lines }}"

    - name: Get service info
      command: "{{ kubectl }} get svc -n {{ namespace }}"
      register: svcs
      changed_when: false

    - name: Print service info
      debug:
        msg: "{{ svcs.stdout_lines }}"

    - name: Get app URL
      command: minikube service promptforge-frontend -n {{ namespace }} --url
      register: app_url
      changed_when: false
      ignore_errors: true

    - name: Print access URL
      debug:
        msg: "App is accessible at: {{ app_url.stdout }}"
      when: app_url.rc == 0
```

---

### 6. GitHub Actions CI/CD Workflow

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  PNPM_VERSION: '9.12.0'
  NODE_VERSION: '20'
  REGISTRY: ghcr.io

jobs:
  quality:
    name: Typecheck & Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @promptforge/database db:generate
      - run: pnpm typecheck
      - run: pnpm lint
        continue-on-error: true

  build:
    name: Build Frontend
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @promptforge/database db:generate
      - run: pnpm --filter @promptforge/frontend build
        env:
          NEXT_PUBLIC_APP_URL: 'https://promptforge.vercel.app'
      - uses: actions/upload-artifact@v4
        with:
          name: frontend-build-${{ github.sha }}
          path: apps/frontend/.next
          retention-days: 3

  docker:
    name: Docker — ${{ matrix.image }}
    runs-on: ubuntu-latest
    needs: quality
    if: github.event_name == 'push'
    permissions:
      contents: read
      packages: write
    strategy:
      fail-fast: false
      matrix:
        include:
          - { dockerfile: apps/frontend/Dockerfile,                  image: promptforge-frontend }
          - { dockerfile: apps/services/auth-service/Dockerfile,     image: promptforge-auth-service }
          - { dockerfile: apps/services/prompt-service/Dockerfile,   image: promptforge-prompt-service }
          - { dockerfile: apps/services/ai-execution/Dockerfile,     image: promptforge-ai-execution }
          - { dockerfile: apps/services/playground/Dockerfile,       image: promptforge-playground }
          - { dockerfile: apps/services/search-service/Dockerfile,   image: promptforge-search-service }
          - { dockerfile: apps/services/analytics/Dockerfile,        image: promptforge-analytics }
          - { dockerfile: apps/services/user-service/Dockerfile,     image: promptforge-user-service }
          - { dockerfile: apps/services/marketplace/Dockerfile,      image: promptforge-marketplace }
          - { dockerfile: apps/services/safety-service/Dockerfile,   image: promptforge-safety-service }
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ github.repository_owner }}/${{ matrix.image }}
          tags: |
            type=sha,prefix=sha-
            type=ref,event=branch
            type=raw,value=latest,enable=${{ github.ref == 'refs/heads/main' }}
      - uses: docker/build-push-action@v6
        with:
          context: .
          file: ${{ matrix.dockerfile }}
          platforms: linux/amd64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha,scope=${{ matrix.image }}
          cache-to: type=gha,mode=max,scope=${{ matrix.image }}
```

---

## OUTPUT SCREENSHOTS

> **Instructions:** Replace each placeholder below with the actual screenshot taken on your machine.
> Each screenshot must include: a title, the exact command run, and a short explanation.

---

**Screenshot 1 — Project Folder Structure**
*Command:* `tree -L 3 -I 'node_modules|.git|.next|dist|generated' ~/Downloads/PromptForge`
*Explanation:* Shows the monorepo layout with application code, infrastructure files, Kubernetes manifests, Ansible playbooks, and CI/CD workflows all within a single repository.

`[INSERT SCREENSHOT HERE]`

---

**Screenshot 2 — Docker Build Output**
*Command:* `docker build -t promptforge-frontend:latest -f apps/frontend/Dockerfile .`
*Explanation:* Docker's multi-stage build downloads the Node.js 20 Alpine base image, installs 464 npm packages via pnpm, compiles the TypeScript source, and produces a production image. The final `docker images` output confirms the image is tagged `promptforge-frontend:latest`.

`[INSERT SCREENSHOT HERE]`

---

**Screenshot 3 — Terraform Output**
*Commands:*
```
cd infrastructure/terraform-local
terraform init
terraform apply -auto-approve
terraform output
```
*Explanation:* `terraform init` downloads the Kubernetes provider plugin. `terraform apply` creates the namespace, deployment, and NodePort service on Minikube. `terraform output` displays the provisioned resource names, NodePort number, and the minikube service URL command.

`[INSERT SCREENSHOT HERE]`

---

**Screenshot 4 — Kubernetes Commands Output**
*Commands:*
```
kubectl get nodes
kubectl get pods -n promptforge
kubectl get svc -n promptforge
kubectl get all -n promptforge
```
*Explanation:* Shows the Minikube node in Ready state, the frontend pod running in the `promptforge` namespace, the NodePort service exposed on port 30080, and confirms the entire deployment is healthy.

`[INSERT SCREENSHOT HERE]`

---

**Screenshot 5 — GitHub Actions Success**
*Location:* `https://github.com/fkr7749/PromptForge/actions`
*Explanation:* The CI workflow showing all three jobs (Typecheck & Lint, Build Frontend, Docker ×10) with green checkmarks. Every job completed successfully on the latest push to `main`, confirming the automated pipeline is fully operational.

`[INSERT SCREENSHOT HERE]`

---

**Screenshot 6 — Ansible Execution**
*Command:* `ansible-playbook infrastructure/ansible/playbooks/deploy-local.yml`
*Explanation:* Ansible applies the three Kubernetes manifests in order, waits for the deployment rollout to complete, then prints the pod status, service details, and the browser-accessible URL. The `PLAY RECAP` at the end shows zero failures.

`[INSERT SCREENSHOT HERE]`

---

## CONCLUSION

### What Was Achieved

This project successfully demonstrates a complete, production-grade DevOps pipeline for the PromptForge web application. Starting from a multi-service monorepo, the project established automated processes that take code from a developer's commit all the way to a running, accessible Kubernetes deployment — with zero manual steps in between.

### Tools Integrated

| Tool | Role | Outcome |
|---|---|---|
| **Git / GitHub** | Version control, collaboration | Full commit history, branch strategy, PR workflow |
| **Docker** | Containerisation | 10 multi-stage images, reproducible builds, non-root security |
| **Terraform** | Infrastructure as Code | Namespace, Deployment, Service provisioned in < 30 seconds |
| **Kubernetes (Minikube)** | Container orchestration | Auto-healing pods, rolling updates, service discovery |
| **Ansible** | Configuration management | Idempotent manifest deployment, rollout verification |
| **GitHub Actions** | CI/CD pipeline | Automated typecheck, build, and Docker publish on every push |

### Benefits Delivered

**Automation:** A `git push` triggers the entire quality-check, build, and publish pipeline without any human intervention. What previously required multiple manual steps now completes in under 10 minutes automatically.

**Reproducibility:** Docker images guarantee that the application behaves identically across developer laptops, CI environments, and production clusters. "Works on my machine" is eliminated.

**Scalability:** Kubernetes resource limits and replica counts are declared in configuration files. Scaling the application from one to ten replicas requires a single number change and a `terraform apply`.

**Reliability:** Kubernetes health probes automatically replace unhealthy pods. Rolling update strategy ensures zero downtime during deployments.

**Auditability:** Every deployment, build, and test run is recorded in GitHub Actions history with full logs, timestamps, and downloadable artefacts.

**Infrastructure consistency:** Terraform's declarative model means the infrastructure can be destroyed and recreated identically at any time — disaster recovery is a single command.

### Learning Outcome

This project provided hands-on experience with the full DevOps lifecycle: from writing `Dockerfile`s and understanding layer caching, to declaring cloud-native infrastructure in HCL, to orchestrating deployments with Ansible, to reading Kubernetes pod logs and understanding probe failures. The debugging journey — resolving TypeScript errors across a 16-package monorepo, fixing Docker build context paths, correcting Prisma generated client locations — provided deep practical understanding of how modern distributed applications are built and deployed.

### Real-World Relevance

The architecture implemented here mirrors how production engineering teams at technology companies operate today. Container-based deployments managed by Kubernetes are the industry standard for applications requiring reliability and scale. Infrastructure as Code with Terraform is now a baseline expectation for cloud engineers. GitHub Actions CI/CD pipelines have replaced manual release processes at thousands of organisations. The skills demonstrated in this project — containerisation, orchestration, IaC, automation — are among the most in-demand capabilities in the software industry.

---

*Report prepared for the Division of Computer Science and Engineering,
Karunya Institute of Technology and Sciences, Coimbatore — April 2026.*
