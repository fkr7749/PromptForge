# PromptForge DevOps Pipeline

> Production-grade Kubernetes deployment on Oracle Cloud Free Tier — $0/month infrastructure

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CI/CD Pipeline                              │
│                                                                     │
│   Developer Push                                                    │
│       │                                                             │
│       ▼                                                             │
│   GitHub ──► GitHub Actions ──► GHCR (Container Registry)          │
│                    │                        │                       │
│                    │ (Helm upgrade)          │ (Docker images)      │
│                    ▼                        ▼                       │
│              Terraform ──────► K3s Cluster (Oracle Cloud ARM)      │
│                    │               ├── Control Plane (4 OCPUs)     │
│                    │               ├── Worker Node 1 (4 OCPUs)     │
│                    └──────────────► Worker Node 2 (4 OCPUs)        │
│                                                                     │
│   Oracle Cloud Free Tier (Always Free ARM Ampere A1)               │
└─────────────────────────────────────────────────────────────────────┘
```

**Flow:** `git push` → GitHub Actions builds images → pushes to GHCR → Helm deploys to K3s on Oracle Cloud ARM instances provisioned by Terraform and configured by Ansible.

---

## What Was Built

### Dockerfiles — 7 files

| File | Service | Port |
|------|---------|------|
| `apps/frontend/Dockerfile` | Next.js frontend | 3000 |
| `apps/services/auth-service/Dockerfile` | Auth service | 4001 |
| `apps/services/prompt-service/Dockerfile` | Prompt management | 4002 |
| `apps/services/ai-execution/Dockerfile` | AI execution | 4003 |
| `apps/services/playground/Dockerfile` | Playground | 4004 |
| `apps/services/search-service/Dockerfile` | Search | 4005 |
| `apps/services/analytics/Dockerfile` | Analytics | 4006 |
| `apps/services/user-service/Dockerfile` | User management | 4007 |
| `apps/services/marketplace/Dockerfile` | Marketplace | 4008 |
| `apps/services/safety-service/Dockerfile` | Safety checks | — |

All use multi-stage builds (deps → builder → production) with non-root users, pnpm workspace awareness, and separate development targets.

### Terraform — 16 files

| File | Description |
|------|-------------|
| `infrastructure/terraform/main.tf` | Root module — wires all sub-modules together |
| `infrastructure/terraform/variables.tf` | All input variables (compartment, SSH key, domain, etc.) |
| `infrastructure/terraform/outputs.tf` | Outputs: IPs, LB IP, Ansible inventory snippet |
| `infrastructure/terraform/terraform.tfvars.example` | Template for your credentials — copy to `terraform.tfvars` |
| `infrastructure/terraform/cloud-init/k8s-control.yaml` | Cloud-init for control plane bootstrap |
| `infrastructure/terraform/modules/compute/main.tf` | ARM A1 instances (control plane + workers) |
| `infrastructure/terraform/modules/compute/variables.tf` | Compute module variables |
| `infrastructure/terraform/modules/compute/outputs.tf` | Instance IPs |
| `infrastructure/terraform/modules/networking/main.tf` | VCN, subnets, security lists, internet gateway |
| `infrastructure/terraform/modules/networking/variables.tf` | Networking variables |
| `infrastructure/terraform/modules/networking/outputs.tf` | Subnet IDs |
| `infrastructure/terraform/modules/loadbalancer/main.tf` | OCI flexible load balancer (free tier) |
| `infrastructure/terraform/modules/loadbalancer/variables.tf` | LB variables |
| `infrastructure/terraform/modules/loadbalancer/outputs.tf` | Load balancer public IP |
| `infrastructure/terraform/modules/storage/main.tf` | Block volumes for persistent storage |
| `infrastructure/terraform/modules/storage/variables.tf` | Storage variables |
| `infrastructure/terraform/modules/storage/outputs.tf` | Volume OCIDs |

### Ansible — 23 files

| File | Description |
|------|-------------|
| `infrastructure/ansible/ansible.cfg` | Ansible configuration (SSH settings, roles path) |
| `infrastructure/ansible/requirements.yml` | Galaxy collections: community.kubernetes, ansible.posix |
| `infrastructure/ansible/inventory/production.ini` | Production host inventory (filled from Terraform output) |
| `infrastructure/ansible/inventory/staging.ini` | Staging host inventory |
| `infrastructure/ansible/group_vars/all.yml` | Variables shared by all hosts |
| `infrastructure/ansible/group_vars/control_plane.yml` | Control plane-specific vars |
| `infrastructure/ansible/group_vars/workers.yml` | Worker node-specific vars |
| `infrastructure/ansible/playbooks/site.yml` | Main playbook — runs all roles |
| `infrastructure/ansible/playbooks/k8s_setup.yml` | Kubernetes-specific setup playbook |
| `infrastructure/ansible/playbooks/rolling_update.yml` | Rolling update playbook for zero-downtime deploys |
| `infrastructure/ansible/roles/common/tasks/main.yml` | System hardening, packages, sysctl tuning |
| `infrastructure/ansible/roles/common/handlers/main.yml` | Common handlers (restart services) |
| `infrastructure/ansible/roles/docker/tasks/main.yml` | Docker/containerd install and configuration |
| `infrastructure/ansible/roles/docker/handlers/main.yml` | Docker handlers |
| `infrastructure/ansible/roles/k3s_control/tasks/main.yml` | K3s control plane install, kubeconfig setup |
| `infrastructure/ansible/roles/k3s_control/handlers/main.yml` | K3s control plane handlers |
| `infrastructure/ansible/roles/k3s_worker/tasks/main.yml` | K3s worker join with token from control plane |
| `infrastructure/ansible/roles/k3s_worker/handlers/main.yml` | K3s worker handlers |
| `infrastructure/ansible/roles/helm/tasks/main.yml` | Helm 3 install + cert-manager + ingress-nginx |
| `infrastructure/ansible/roles/helm/handlers/main.yml` | Helm handlers |
| `infrastructure/ansible/roles/monitoring/tasks/main.yml` | Prometheus + Grafana + Loki deployment |
| `infrastructure/ansible/roles/monitoring/handlers/main.yml` | Monitoring handlers |
| `infrastructure/ansible/files/letsencrypt-clusterissuer.yaml` | cert-manager ClusterIssuer for Let's Encrypt TLS |

### Helm Chart — 43 files

| Path | Description |
|------|-------------|
| `helm/promptforge/Chart.yaml` | Chart metadata, version, appVersion |
| `helm/promptforge/values.yaml` | Default values — image tags, replicas, resources |
| `helm/promptforge/values-staging.yaml` | Staging overrides (reduced replicas, staging domain) |
| `helm/promptforge/values-production.yaml` | Production overrides (HPA enabled, resource limits) |
| `helm/promptforge/templates/_helpers.tpl` | Shared template helpers and label macros |
| `helm/promptforge/templates/namespace.yaml` | Kubernetes Namespace |
| `helm/promptforge/templates/configmap.yaml` | Shared ConfigMap (env vars across services) |
| `helm/promptforge/templates/secrets.yaml` | ExternalSecret / Secret template |
| `helm/promptforge/templates/ingress.yaml` | Ingress with TLS (cert-manager annotation) |
| `helm/promptforge/templates/NOTES.txt` | Post-install instructions |
| `helm/promptforge/templates/frontend/deployment.yaml` | Frontend Deployment |
| `helm/promptforge/templates/frontend/service.yaml` | Frontend Service |
| `helm/promptforge/templates/frontend/hpa.yaml` | Frontend HorizontalPodAutoscaler |
| `helm/promptforge/templates/auth-service/deployment.yaml` | Auth service Deployment |
| `helm/promptforge/templates/auth-service/service.yaml` | Auth service Service |
| `helm/promptforge/templates/auth-service/hpa.yaml` | Auth service HPA |
| `helm/promptforge/templates/prompt-service/deployment.yaml` | Prompt service Deployment |
| `helm/promptforge/templates/prompt-service/service.yaml` | Prompt service Service |
| `helm/promptforge/templates/prompt-service/hpa.yaml` | Prompt service HPA |
| `helm/promptforge/templates/ai-execution/deployment.yaml` | AI execution Deployment |
| `helm/promptforge/templates/ai-execution/service.yaml` | AI execution Service |
| `helm/promptforge/templates/ai-execution/hpa.yaml` | AI execution HPA |
| `helm/promptforge/templates/playground/deployment.yaml` | Playground Deployment |
| `helm/promptforge/templates/playground/service.yaml` | Playground Service |
| `helm/promptforge/templates/playground/hpa.yaml` | Playground HPA |
| `helm/promptforge/templates/search-service/deployment.yaml` | Search service Deployment |
| `helm/promptforge/templates/search-service/service.yaml` | Search service Service |
| `helm/promptforge/templates/search-service/hpa.yaml` | Search service HPA |
| `helm/promptforge/templates/analytics/deployment.yaml` | Analytics Deployment |
| `helm/promptforge/templates/analytics/service.yaml` | Analytics Service |
| `helm/promptforge/templates/analytics/hpa.yaml` | Analytics HPA |
| `helm/promptforge/templates/user-service/deployment.yaml` | User service Deployment |
| `helm/promptforge/templates/user-service/service.yaml` | User service Service |
| `helm/promptforge/templates/user-service/hpa.yaml` | User service HPA |
| `helm/promptforge/templates/marketplace/deployment.yaml` | Marketplace Deployment |
| `helm/promptforge/templates/marketplace/service.yaml` | Marketplace Service |
| `helm/promptforge/templates/marketplace/hpa.yaml` | Marketplace HPA |
| `helm/promptforge/templates/safety-service/deployment.yaml` | Safety service Deployment |
| `helm/promptforge/templates/safety-service/service.yaml` | Safety service Service |
| `helm/promptforge/templates/safety-service/hpa.yaml` | Safety service HPA |

### GitHub Actions Workflows — 4 files

| File | Description |
|------|-------------|
| `.github/workflows/ci.yml` | CI pipeline: lint, typecheck, test on every push/PR |
| `.github/workflows/main.yml` | Main CD pipeline: build images → push to GHCR → Helm deploy (staging on `develop`, production on `main` with approval gate) |
| `.github/workflows/pr-checks.yml` | PR quality gate: required status checks before merge |
| `.github/workflows/security-scan.yml` | Trivy vulnerability scanning of container images |

### Monitoring Stack — 6 files

| File | Description |
|------|-------------|
| `infrastructure/monitoring/prometheus/prometheus.yml` | Prometheus scrape configuration (all services + K3s) |
| `infrastructure/monitoring/prometheus/alert-rules.yml` | Alerting rules (pod crashes, high latency, DB errors) |
| `infrastructure/monitoring/grafana/dashboards/platform-health.json` | Grafana dashboard: service health, request rates, error rates |
| `infrastructure/monitoring/grafana/provisioning/dashboards/dashboards.yml` | Grafana dashboard provisioning config |
| `infrastructure/monitoring/grafana/provisioning/datasources/datasources.yml` | Grafana datasource provisioning (Prometheus + Loki) |
| `infrastructure/monitoring/loki/loki-config.yml` | Loki log aggregation configuration |

### Health Check Endpoints — added to all services

Every NestJS microservice now exposes three endpoints under `/api/health/`:

| Endpoint | Purpose | Kubernetes probe type |
|----------|---------|----------------------|
| `GET /api/health/live` | Process is alive | `livenessProbe` |
| `GET /api/health/ready` | DB connection healthy | `readinessProbe` |
| `GET /api/health/startup` | Migrations applied | `startupProbe` |

---

## Prerequisites — What YOU Need

### Step 1: Oracle Cloud Account

1. Sign up at [cloud.oracle.com](https://cloud.oracle.com) (free, no credit card required for Always Free tier)
2. Complete identity verification
3. Note your **Tenancy OCID** — found at Profile → Tenancy → OCID
4. Create an **API signing key**:
   ```bash
   mkdir -p ~/.oci
   openssl genrsa -out ~/.oci/oci_api_key.pem 2048
   chmod 600 ~/.oci/oci_api_key.pem
   openssl rsa -pubout -in ~/.oci/oci_api_key.pem -out ~/.oci/oci_api_key_public.pem
   ```
5. Upload the public key in OCI Console → Profile → API Keys → Add API Key
6. Note the **fingerprint** shown after upload
7. Note your **User OCID** — found at Profile → User Settings → OCID
8. Choose a **region** (e.g., `us-ashburn-1`) — pick one close to you that has ARM A1 availability

### Step 2: SSH Key Pair

```bash
ssh-keygen -t ed25519 -C "promptforge-oracle" -f ~/.ssh/promptforge_oracle
# Press Enter twice for no passphrase (or set one and manage it in CI)
```

Keep `~/.ssh/promptforge_oracle` private. You'll use `~/.ssh/promptforge_oracle.pub` as `ssh_public_key` in Terraform.

### Step 3: GitHub Secrets

Navigate to your repo → Settings → Secrets and variables → Actions → New repository secret.

| Secret Name | Value | Where to find it |
|-------------|-------|-----------------|
| `OCI_TENANCY_OCID` | `ocid1.tenancy.oc1..xxx` | OCI Console → Profile → Tenancy |
| `OCI_USER_OCID` | `ocid1.user.oc1..xxx` | OCI Console → Profile → User Settings |
| `OCI_FINGERPRINT` | `xx:xx:xx:...` | OCI Console → Profile → API Keys |
| `OCI_PRIVATE_KEY` | Contents of `~/.oci/oci_api_key.pem` | Your local file |
| `OCI_REGION` | e.g., `us-ashburn-1` | Your chosen region |
| `SSH_PRIVATE_KEY` | Contents of `~/.ssh/promptforge_oracle` | Your local file |
| `KUBECONFIG_PRODUCTION` | Base64-encoded kubeconfig | Generated in Phase 3 below |
| `KUBECONFIG_STAGING` | Base64-encoded kubeconfig (staging cluster) | Generated in Phase 3 below |
| `DATABASE_URL` | PostgreSQL connection string | Your managed DB |
| `JWT_SECRET` | Random 64-char string | `openssl rand -base64 48` |
| `GROQ_API_KEY` | Groq API key | [console.groq.com](https://console.groq.com) |
| `NEXTAUTH_SECRET` | Random 32-char string | `openssl rand -base64 24` |
| `GHCR_TOKEN` | GitHub Personal Access Token | GitHub → Settings → Developer settings → PAT (write:packages scope) |

---

## Deployment Steps

### Phase 1: Provision Infrastructure (Terraform)

```bash
cd infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your Oracle Cloud credentials:

```hcl
tenancy_ocid     = "ocid1.tenancy.oc1..your-tenancy-ocid"
user_ocid        = "ocid1.user.oc1..your-user-ocid"
fingerprint      = "xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx"
private_key_path = "~/.oci/oci_api_key.pem"
region           = "us-ashburn-1"
ssh_public_key   = "ssh-ed25519 AAAA... promptforge-oracle"
compartment_ocid = "ocid1.compartment.oc1..your-compartment-ocid"
domain_name      = "yourdomain.com"
```

```bash
terraform init
terraform plan        # Review: should show 3 instances + VCN + LB
terraform apply       # Type 'yes' — takes ~5 minutes
```

Save the output — you'll need the IPs in the next phase.

### Phase 2: Configure Servers (Ansible)

```bash
# Copy Terraform output into the inventory
terraform output ansible_inventory > ../ansible/inventory/production.ini
# Review and fix any formatting issues in the .ini file

cd ../ansible
ansible-galaxy collection install -r requirements.yml

# Test connectivity first
ansible all -i inventory/production.ini -m ping

# Run the full site playbook (installs K3s, Helm, cert-manager, monitoring)
ansible-playbook -i inventory/production.ini playbooks/site.yml
```

This takes 10–15 minutes. It will:
- Harden all nodes (firewall, sysctl, unattended-upgrades)
- Install containerd and K3s
- Join workers to the control plane
- Install Helm, ingress-nginx, cert-manager
- Deploy the monitoring stack (Prometheus + Grafana + Loki)

### Phase 3: Set Up kubeconfig

```bash
# Fetch kubeconfig from the control plane
ssh -i ~/.ssh/promptforge_oracle ubuntu@<CONTROL_PLANE_IP> \
  "sudo cat /etc/rancher/k3s/k3s.yaml" | \
  sed "s/127.0.0.1/<CONTROL_PLANE_IP>/g" > kubeconfig-production.yaml

# Verify it works
KUBECONFIG=kubeconfig-production.yaml kubectl get nodes

# Base64-encode for GitHub secret
base64 -w 0 kubeconfig-production.yaml
# Copy the output and add as KUBECONFIG_PRODUCTION GitHub secret
```

### Phase 4: Configure DNS

```bash
# Get the load balancer public IP
cd infrastructure/terraform
terraform output load_balancer_ip
```

In your DNS provider, create:

| Record type | Name | Value |
|-------------|------|-------|
| `A` | `yourdomain.com` | `<LOAD_BALANCER_IP>` |
| `A` | `*.yourdomain.com` | `<LOAD_BALANCER_IP>` |

DNS propagation takes 1–60 minutes. You can check with `dig yourdomain.com`.

### Phase 5: Deploy via GitHub Actions

```bash
# Deploy to staging
git push origin develop

# Deploy to production (triggers manual approval gate)
git push origin main
```

The production workflow will pause at a manual approval step. Go to Actions → the workflow run → Review deployments → Approve.

---

## Verification

```bash
# Cluster health
kubectl get nodes
# Expected: 3 nodes all showing Ready

# All pods running
kubectl get pods -n promptforge-prod
# Expected: all pods in Running state, no CrashLoopBackOff

# Ingress with TLS
kubectl get ingress -n promptforge-prod
# Expected: shows yourdomain.com with ADDRESS set and TLS column showing your cert

# Health endpoints for each service
curl https://yourdomain.com/api/health/live
# Expected: {"status":"ok","service":"...","timestamp":"..."}

curl https://yourdomain.com/api/health/ready
# Expected: {"status":"ready","db":"ok","timestamp":"..."}

# Check cert-manager issued the certificate
kubectl get certificate -n promptforge-prod
# Expected: READY=True

# Check HPA is working (after load)
kubectl get hpa -n promptforge-prod
```

---

## Cost Summary

All resources fit within Oracle Cloud's **Always Free** tier:

| Resource | Spec | Monthly Cost |
|----------|------|-------------|
| ARM A1 Control Plane | 4 OCPUs, 24 GB RAM | $0 |
| ARM A1 Worker Node 1 | 4 OCPUs, 24 GB RAM | $0 |
| ARM A1 Worker Node 2 | 4 OCPUs, 24 GB RAM | $0 |
| Flexible Load Balancer | 10 Mbps, 1 instance | $0 |
| Block Volumes | Up to 200 GB total | $0 |
| Object Storage | Up to 20 GB | $0 |
| Outbound Data Transfer | Up to 10 TB/month | $0 |
| **Total** | | **$0/month** |

> Note: Oracle Cloud Always Free ARM A1 provides up to 4 instances totalling 24 OCPUs and 144 GB RAM. This deployment uses 12 OCPUs and 72 GB RAM — well within the free quota.

---

## Troubleshooting

### `terraform apply` fails with "Out of host capacity"

Oracle Cloud free tier ARM instances occasionally have capacity constraints by region.

**Fix:** Try a different availability domain:
```bash
# In terraform.tfvars, change:
availability_domain = "2"   # Try 1, 2, or 3
```
Or try a different region (Frankfurt `eu-frankfurt-1`, London `uk-london-1`, etc.).

### Ansible `ansible-playbook` hangs on SSH

**Fix:** Ensure your SSH key is correct and security list allows port 22:
```bash
# Test manually
ssh -i ~/.ssh/promptforge_oracle ubuntu@<CONTROL_PLANE_IP> echo "ok"

# If that hangs, check OCI Console → Networking → Security Lists
# Ingress rule for port 22 from 0.0.0.0/0 must exist
```

### K3s workers not joining the cluster

**Fix:** Verify the worker can reach the control plane on port 6443:
```bash
# From the worker node
curl -k https://<CONTROL_PLANE_IP>:6443/healthz
# Should return "ok"

# Check the K3s token matches
sudo cat /var/lib/rancher/k3s/server/node-token   # on control plane
# Compare with what Ansible used
```

### Pods stuck in `CrashLoopBackOff`

```bash
# Check logs
kubectl logs -n promptforge-prod <pod-name> --previous

# Common causes:
# 1. Missing secrets — check env vars: kubectl describe pod <pod-name> -n promptforge-prod
# 2. DATABASE_URL wrong — verify connection string includes correct host/port
# 3. Image pull failure — check GHCR_TOKEN secret and image name spelling
```

### TLS certificate not issuing (cert-manager)

```bash
kubectl describe certificate -n promptforge-prod
kubectl describe certificaterequest -n promptforge-prod
kubectl logs -n cert-manager deployment/cert-manager

# Common causes:
# 1. DNS not propagated yet — wait and retry
# 2. Rate limited by Let's Encrypt — use staging issuer first
# 3. ClusterIssuer not created — kubectl get clusterissuer
```

### `helm upgrade` fails during GitHub Actions deploy

```bash
# Check if a previous deploy is stuck in a failed state
helm list -n promptforge-prod
helm history promptforge -n promptforge-prod

# Roll back to last good version
helm rollback promptforge -n promptforge-prod

# Then re-run the workflow
```

### Health endpoint returns `not-ready` (db: error)

```bash
# Check if the database pod/service is running
kubectl get pods -n promptforge-prod | grep postgres

# Check the DATABASE_URL secret is correct
kubectl get secret promptforge-secrets -n promptforge-prod -o jsonpath='{.data.DATABASE_URL}' | base64 -d

# Run a migration manually if needed
kubectl exec -it -n promptforge-prod deployment/prompt-service -- \
  npx prisma migrate deploy
```
