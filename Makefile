.PHONY: help dev build test clean db-migrate db-seed docker-up docker-down logs

# Colors
GREEN  := \033[0;32m
YELLOW := \033[1;33m
RESET  := \033[0m

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "\n${YELLOW}PromptForge Commands${RESET}\n\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  ${GREEN}%-20s${RESET} %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

# ─── Development ──────────────────────────────────────────────────────────────
dev: ## Start all services (hot reload)
	pnpm dev

dev-frontend: ## Start only the frontend
	pnpm --filter @promptforge/frontend dev

dev-services: ## Start all backend services via docker-compose
	docker compose up --build

# ─── Build ────────────────────────────────────────────────────────────────────
build: ## Build all packages
	pnpm build

build-frontend: ## Build frontend only
	pnpm --filter @promptforge/frontend build

# ─── Database ─────────────────────────────────────────────────────────────────
db-generate: ## Generate Prisma client
	pnpm db:generate

db-migrate: ## Run database migrations
	pnpm db:migrate

db-push: ## Push schema to database (dev)
	pnpm db:push

db-seed: ## Seed the database
	pnpm db:seed

db-studio: ## Open Prisma Studio
	pnpm --filter @promptforge/database db:studio

# ─── Docker ───────────────────────────────────────────────────────────────────
docker-up: ## Start all services with Docker Compose
	docker compose up -d

docker-down: ## Stop all Docker services
	docker compose down

docker-build: ## Build all Docker images
	docker compose build

logs: ## Tail logs from all services
	docker compose logs -f

# ─── Testing ──────────────────────────────────────────────────────────────────
test: ## Run all tests
	pnpm test

lint: ## Lint all packages
	pnpm lint

typecheck: ## Type-check all packages
	pnpm typecheck

# ─── Utilities ────────────────────────────────────────────────────────────────
clean: ## Clean all build outputs and node_modules
	pnpm clean

install: ## Install all dependencies
	pnpm install

format: ## Format all files
	pnpm format

# ─── Infrastructure (Minikube / Local K8s) ────────────────────────────────────
docker-build-frontend: ## Build the frontend Docker image locally
	docker build -t promptforge-frontend:latest -f apps/frontend/Dockerfile .

tf-init: ## Initialise Terraform (Minikube provider)
	cd infrastructure/terraform-local && terraform init

tf-plan: ## Preview Terraform changes
	cd infrastructure/terraform-local && terraform plan

tf-apply: ## Apply Terraform configuration to Minikube
	cd infrastructure/terraform-local && terraform apply -auto-approve

tf-destroy: ## Destroy Terraform-managed resources
	cd infrastructure/terraform-local && terraform destroy -auto-approve

ansible-deploy: ## Deploy app to Minikube via Ansible
	ansible-playbook infrastructure/ansible/playbooks/deploy-local.yml

k8s-status: ## Show pod and service status in the promptforge namespace
	kubectl get pods,svc -n promptforge -o wide

k8s-logs: ## Tail logs from the frontend pod
	kubectl logs -n promptforge -l component=frontend --tail=100 -f

minikube-url: ## Get the Minikube service URL for the frontend
	minikube service promptforge-frontend -n promptforge --url
