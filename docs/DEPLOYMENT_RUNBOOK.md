# PromptForge Deployment Runbook

> Step-by-step operational guide for deploying and maintaining PromptForge on Oracle Cloud Free Tier K3s.
> For the high-level architecture overview, see `DEVOPS_PLAN.md` in the project root.

---

## Table of Contents

1. [Prerequisites Checklist](#1-prerequisites-checklist)
2. [First-Time Setup](#2-first-time-setup)
3. [Provision Infrastructure](#3-provision-infrastructure)
4. [Configure the Cluster](#4-configure-the-cluster)
5. [Set Up GitHub Secrets](#5-set-up-github-secrets)
6. [First Deployment](#6-first-deployment)
7. [Day-2 Operations](#7-day-2-operations)
8. [Rollback Procedures](#8-rollback-procedures)
9. [Monitoring and Alerting](#9-monitoring-and-alerting)
10. [Disaster Recovery](#10-disaster-recovery)
11. [Upgrading Components](#11-upgrading-components)

---

## 1. Prerequisites Checklist

Before starting, confirm you have:

- [ ] Oracle Cloud account created and verified
- [ ] OCI CLI installed: `brew install oci-cli` or `pip install oci-cli`
- [ ] Terraform >= 1.6 installed: `brew install terraform`
- [ ] Ansible >= 2.14 installed: `pip install ansible`
- [ ] kubectl installed: `brew install kubectl`
- [ ] Helm >= 3.12 installed: `brew install helm`
- [ ] `gh` CLI installed and authenticated: `brew install gh && gh auth login`
- [ ] SSH key pair generated (see below)
- [ ] Your domain name ready with access to its DNS settings

---

## 2. First-Time Setup

### 2.1 Clone and install dependencies

```bash
git clone https://github.com/your-org/promptforge.git
cd promptforge
pnpm install
```

### 2.2 Generate SSH key

```bash
ssh-keygen -t ed25519 -C "promptforge-oracle" -f ~/.ssh/promptforge_oracle
chmod 600 ~/.ssh/promptforge_oracle
```

### 2.3 Create OCI API key

```bash
mkdir -p ~/.oci
openssl genrsa -out ~/.oci/oci_api_key.pem 2048
chmod 600 ~/.oci/oci_api_key.pem
openssl rsa -pubout \
  -in ~/.oci/oci_api_key.pem \
  -out ~/.oci/oci_api_key_public.pem
```

Upload `~/.oci/oci_api_key_public.pem` in:
**OCI Console → Profile icon → My profile → API keys → Add API key → Paste public key**

Save the fingerprint shown — you'll need it for `terraform.tfvars`.

### 2.4 Configure Terraform variables

```bash
cd infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars
```

Open `terraform.tfvars` and fill in every value:

```hcl
# OCI Identity
tenancy_ocid     = "ocid1.tenancy.oc1..aaaa..."
user_ocid        = "ocid1.user.oc1..aaaa..."
fingerprint      = "ab:cd:ef:01:23:45:67:89:ab:cd:ef:01:23:45:67:89"
private_key_path = "~/.oci/oci_api_key.pem"
region           = "us-ashburn-1"

# Compute
compartment_ocid    = "ocid1.compartment.oc1..aaaa..."
ssh_public_key      = "ssh-ed25519 AAAAC3Nza... promptforge-oracle"
availability_domain = "1"   # Try 1, 2, or 3 if one is unavailable

# Application
domain_name = "yourdomain.com"
environment = "production"
```

---

## 3. Provision Infrastructure

### 3.1 Initialize and plan

```bash
cd infrastructure/terraform
terraform init

# Review what will be created — should be ~20 resources
terraform plan -out=tfplan
```

Expected resources:
- 1 VCN with internet gateway, route table, security list
- 3 subnets (control plane, workers, load balancer)
- 1 control plane instance (ARM A1, 4 OCPU, 24 GB)
- 2 worker instances (ARM A1, 4 OCPU each, 24 GB each)
- 1 flexible load balancer
- 3 block volumes (one per instance)

### 3.2 Apply

```bash
terraform apply tfplan
# Type 'yes' when prompted
# Takes approximately 5–8 minutes
```

### 3.3 Save outputs

```bash
terraform output
# Copy the full output and save it somewhere safe

# Key outputs you'll use:
terraform output control_plane_ip
terraform output worker_ips
terraform output load_balancer_ip
```

---

## 4. Configure the Cluster

### 4.1 Test SSH connectivity

```bash
CONTROL_PLANE_IP=$(cd infrastructure/terraform && terraform output -raw control_plane_ip)

ssh -i ~/.ssh/promptforge_oracle ubuntu@$CONTROL_PLANE_IP echo "Connection OK"
```

If this fails, check OCI security list allows TCP 22 from `0.0.0.0/0`.

### 4.2 Populate the Ansible inventory

```bash
cd infrastructure/terraform
terraform output ansible_inventory > ../ansible/inventory/production.ini

# Review and fix formatting
cat ../ansible/inventory/production.ini
```

The file should look like:

```ini
[control_plane]
<CONTROL_PLANE_IP> ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/promptforge_oracle

[workers]
<WORKER_1_IP> ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/promptforge_oracle
<WORKER_2_IP> ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/promptforge_oracle

[all:children]
control_plane
workers
```

### 4.3 Install Ansible Galaxy dependencies

```bash
cd infrastructure/ansible
ansible-galaxy collection install -r requirements.yml
```

### 4.4 Test Ansible connectivity

```bash
ansible all -i inventory/production.ini -m ping
# All 3 hosts should return pong
```

### 4.5 Run the full site playbook

```bash
ansible-playbook -i inventory/production.ini playbooks/site.yml
```

This runs in sequence: `common` → `docker` → `k3s_control` → `k3s_worker` → `helm` → `monitoring`.

Takes approximately 10–15 minutes. You can add `-v` for verbose output.

### 4.6 Extract and configure kubeconfig

```bash
CONTROL_PLANE_IP=$(cd infrastructure/terraform && terraform output -raw control_plane_ip)

# Pull kubeconfig from the cluster and fix the server address
ssh -i ~/.ssh/promptforge_oracle ubuntu@$CONTROL_PLANE_IP \
  "sudo cat /etc/rancher/k3s/k3s.yaml" | \
  sed "s/127.0.0.1/${CONTROL_PLANE_IP}/g" > kubeconfig-production.yaml

chmod 600 kubeconfig-production.yaml

# Test it
KUBECONFIG=kubeconfig-production.yaml kubectl get nodes
```

Expected output — all 3 nodes should be `Ready`:

```
NAME              STATUS   ROLES                  AGE   VERSION
control-plane-1   Ready    control-plane,master   5m    v1.28.x+k3s1
worker-1          Ready    <none>                 3m    v1.28.x+k3s1
worker-2          Ready    <none>                 3m    v1.28.x+k3s1
```

### 4.7 Verify cert-manager and ingress-nginx

```bash
export KUBECONFIG=kubeconfig-production.yaml

kubectl get pods -n cert-manager
# All 3 cert-manager pods should be Running

kubectl get pods -n ingress-nginx
# ingress-nginx-controller pod should be Running

kubectl get clusterissuer
# letsencrypt-production and letsencrypt-staging should be READY=True
```

---

## 5. Set Up GitHub Secrets

Go to your repository → **Settings → Secrets and variables → Actions**.

Add each secret:

```bash
# Use gh CLI to set secrets non-interactively:

gh secret set OCI_TENANCY_OCID --body "ocid1.tenancy.oc1..aaaa..."
gh secret set OCI_USER_OCID --body "ocid1.user.oc1..aaaa..."
gh secret set OCI_FINGERPRINT --body "ab:cd:ef:..."
gh secret set OCI_PRIVATE_KEY < ~/.oci/oci_api_key.pem
gh secret set OCI_REGION --body "us-ashburn-1"
gh secret set SSH_PRIVATE_KEY < ~/.ssh/promptforge_oracle

# Base64-encode the kubeconfig for GitHub
gh secret set KUBECONFIG_PRODUCTION --body "$(base64 -w 0 kubeconfig-production.yaml)"

# Application secrets
gh secret set DATABASE_URL --body "postgresql://user:pass@host:5432/promptforge"
gh secret set JWT_SECRET --body "$(openssl rand -base64 48)"
gh secret set NEXTAUTH_SECRET --body "$(openssl rand -base64 24)"
gh secret set GROQ_API_KEY --body "gsk_..."

# Create a GitHub PAT with write:packages scope, then:
gh secret set GHCR_TOKEN --body "ghp_..."
```

---

## 6. First Deployment

### 6.1 Configure DNS before deploying

```bash
LB_IP=$(cd infrastructure/terraform && terraform output -raw load_balancer_ip)
echo "Point your domain to: $LB_IP"
```

In your DNS provider:
- `A` record: `yourdomain.com` → `<LB_IP>`
- `A` record: `*.yourdomain.com` → `<LB_IP>` (for subdomains / staging)

Verify propagation:
```bash
dig +short yourdomain.com
# Should return the LB IP
```

### 6.2 Deploy to staging first

```bash
git checkout develop
git push origin develop
```

Watch the Actions tab in GitHub. The workflow will:
1. Run lint + typecheck + tests
2. Build Docker images for all services
3. Push images to GitHub Container Registry (GHCR)
4. Run `helm upgrade --install` targeting the staging namespace

```bash
# Monitor the staging deployment
export KUBECONFIG=kubeconfig-production.yaml
kubectl get pods -n promptforge-staging -w
```

### 6.3 Verify staging

```bash
curl https://staging.yourdomain.com/api/health/live
# {"status":"ok","service":"auth-service","timestamp":"..."}
```

### 6.4 Deploy to production

```bash
git checkout main
git merge develop
git push origin main
```

The production workflow will pause for manual approval. Go to:
**Actions → the workflow run → Review deployments → Approve and deploy**

```bash
# Monitor production deployment
kubectl get pods -n promptforge-prod -w
```

### 6.5 Verify production

```bash
# All pods running
kubectl get pods -n promptforge-prod

# Certificate issued
kubectl get certificate -n promptforge-prod
# READY column should be True

# All health checks passing
for svc in auth-service prompt-service analytics marketplace playground search-service user-service; do
  echo -n "$svc: "
  curl -s https://yourdomain.com/api/health/live | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['status'])"
done
```

---

## 7. Day-2 Operations

### 7.1 Deploying a code change

```bash
# For staging:
git push origin develop

# For production (after staging verification):
git push origin main
# Approve in GitHub Actions UI
```

### 7.2 Scaling a service manually

```bash
export KUBECONFIG=kubeconfig-production.yaml

# Scale up prompt-service to 3 replicas
kubectl scale deployment prompt-service -n promptforge-prod --replicas=3

# Check rollout
kubectl rollout status deployment/prompt-service -n promptforge-prod
```

HPA will take over automatic scaling based on CPU/memory thresholds configured in `helm/promptforge/values-production.yaml`.

### 7.3 Viewing logs

```bash
# Stream logs from all pods of a service
kubectl logs -n promptforge-prod -l app=auth-service -f

# Logs from a specific pod
kubectl logs -n promptforge-prod <pod-name> -f

# Previous container logs (after crash)
kubectl logs -n promptforge-prod <pod-name> --previous

# All services at once (requires stern: brew install stern)
stern -n promptforge-prod ".*" --tail 50
```

### 7.4 Accessing Grafana

```bash
# Get the Grafana service URL (LoadBalancer or NodePort depending on config)
kubectl get svc -n monitoring

# Port-forward for local access
kubectl port-forward -n monitoring svc/grafana 3001:80
# Then open http://localhost:3001
# Default credentials: admin / (check values.yaml or the generated secret)
```

### 7.5 Running a database migration

```bash
# Execute migration inside a running pod
kubectl exec -it -n promptforge-prod deployment/prompt-service -- \
  npx prisma migrate deploy

# Or run a one-off job
kubectl run -it --rm migrate \
  --image=ghcr.io/your-org/promptforge/prompt-service:latest \
  --restart=Never \
  -n promptforge-prod \
  --env-from=secret/promptforge-secrets \
  -- npx prisma migrate deploy
```

### 7.6 Checking certificate status

```bash
kubectl get certificate -n promptforge-prod
kubectl describe certificate promptforge-tls -n promptforge-prod

# Force renewal if near expiry
kubectl delete certificate promptforge-tls -n promptforge-prod
# cert-manager will re-issue automatically
```

### 7.7 Updating a Kubernetes secret

```bash
# Update a single secret value
kubectl patch secret promptforge-secrets -n promptforge-prod \
  --type='json' \
  -p='[{"op":"replace","path":"/data/GROQ_API_KEY","value":"'$(echo -n "new-key" | base64)'"}]'

# Restart affected pods to pick up the new value
kubectl rollout restart deployment/ai-execution -n promptforge-prod
```

---

## 8. Rollback Procedures

### 8.1 Helm rollback (recommended)

```bash
export KUBECONFIG=kubeconfig-production.yaml

# View release history
helm history promptforge -n promptforge-prod

# Roll back to the previous release
helm rollback promptforge -n promptforge-prod

# Roll back to a specific revision
helm rollback promptforge 3 -n promptforge-prod

# Monitor the rollback
kubectl rollout status deployment/auth-service -n promptforge-prod
```

### 8.2 Kubernetes Deployment rollback

```bash
# Roll back a single deployment
kubectl rollout undo deployment/auth-service -n promptforge-prod

# Roll back to a specific revision
kubectl rollout history deployment/auth-service -n promptforge-prod
kubectl rollout undo deployment/auth-service -n promptforge-prod --to-revision=2
```

### 8.3 GitHub Actions: re-deploy a previous image tag

```bash
# Find the image tag from a previous successful run
gh run list --workflow=main.yml --status=success --limit=5

# Trigger a manual deployment with a specific image tag
gh workflow run main.yml \
  --field image_tag=sha-abc1234 \
  --ref main
```

---

## 9. Monitoring and Alerting

### 9.1 Prometheus

```bash
# Port-forward Prometheus
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# Open http://localhost:9090
```

Useful PromQL queries:
```promql
# Error rate per service
rate(http_requests_total{status=~"5.."}[5m])

# Pod restarts in last hour
increase(kube_pod_container_status_restarts_total[1h]) > 0

# Memory usage per container
container_memory_usage_bytes{namespace="promptforge-prod"}

# Health check success rate
rate(http_requests_total{path="/api/health/live",status="200"}[5m])
```

### 9.2 Alert rules

Alert rules are defined in `infrastructure/monitoring/prometheus/alert-rules.yml`. Key alerts:

| Alert | Condition | Severity |
|-------|-----------|---------|
| `ServiceDown` | Pod not running for 5m | critical |
| `HighErrorRate` | >5% 5xx responses for 5m | warning |
| `DatabaseUnreachable` | `/api/health/ready` returning `not-ready` | critical |
| `HighMemoryUsage` | Container using >90% of limit | warning |
| `CertificateExpiringSoon` | TLS cert expires in <14 days | warning |

### 9.3 Loki log queries

```bash
# Port-forward Loki (query via Grafana Explore tab instead)
kubectl port-forward -n monitoring svc/loki 3100:3100
```

LogQL examples in Grafana Explore:
```logql
# All errors from auth-service
{app="auth-service"} |= "ERROR"

# Slow requests (>1000ms)
{namespace="promptforge-prod"} | json | duration > 1000

# Database connection errors
{namespace="promptforge-prod"} |~ "connection refused|ECONNREFUSED"
```

---

## 10. Disaster Recovery

### 10.1 Complete cluster loss

If all 3 nodes are gone:

```bash
# 1. Re-provision with Terraform
cd infrastructure/terraform
terraform apply

# 2. Re-run Ansible
cd infrastructure/ansible
ansible-playbook -i inventory/production.ini playbooks/site.yml

# 3. Re-extract kubeconfig
CONTROL_PLANE_IP=$(cd infrastructure/terraform && terraform output -raw control_plane_ip)
ssh -i ~/.ssh/promptforge_oracle ubuntu@$CONTROL_PLANE_IP \
  "sudo cat /etc/rancher/k3s/k3s.yaml" | \
  sed "s/127.0.0.1/${CONTROL_PLANE_IP}/g" > kubeconfig-production.yaml

# 4. Update KUBECONFIG_PRODUCTION GitHub secret
gh secret set KUBECONFIG_PRODUCTION --body "$(base64 -w 0 kubeconfig-production.yaml)"

# 5. Re-deploy via GitHub Actions
gh workflow run main.yml --ref main
```

RTO (Recovery Time Objective): approximately 30–45 minutes.

### 10.2 Single node failure

K3s continues to operate with the control plane + 1 worker. Pods will be rescheduled automatically.

```bash
# Check which pods were evicted
kubectl get pods -n promptforge-prod --field-selector=status.phase=Failed

# Delete failed pods (they'll reschedule)
kubectl delete pods -n promptforge-prod --field-selector=status.phase=Failed
```

### 10.3 Database backup and restore

```bash
# Create a database dump (run from within the cluster or via your managed DB UI)
kubectl exec -it -n promptforge-prod deployment/prompt-service -- \
  pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Restore from dump
kubectl exec -i -n promptforge-prod deployment/prompt-service -- \
  psql $DATABASE_URL < backup-20260322-120000.sql
```

---

## 11. Upgrading Components

### 11.1 Upgrade K3s

```bash
# Run the rolling update playbook
cd infrastructure/ansible
ansible-playbook -i inventory/production.ini playbooks/rolling_update.yml

# Verify new version
export KUBECONFIG=kubeconfig-production.yaml
kubectl get nodes -o wide
```

### 11.2 Upgrade Helm chart values

```bash
export KUBECONFIG=kubeconfig-production.yaml

# Preview changes
helm diff upgrade promptforge ./helm/promptforge \
  -n promptforge-prod \
  -f helm/promptforge/values-production.yaml

# Apply
helm upgrade promptforge ./helm/promptforge \
  -n promptforge-prod \
  -f helm/promptforge/values-production.yaml \
  --atomic \
  --timeout 10m
```

`--atomic` automatically rolls back if any pod fails to become ready within the timeout.

### 11.3 Update a container image tag manually

```bash
# Update a single service's image without a full Helm upgrade
kubectl set image deployment/auth-service \
  auth-service=ghcr.io/your-org/promptforge/auth-service:sha-newcommit \
  -n promptforge-prod

kubectl rollout status deployment/auth-service -n promptforge-prod
```

### 11.4 Upgrade cert-manager

```bash
# cert-manager is managed via Helm (installed by Ansible's helm role)
helm repo update
helm upgrade cert-manager jetstack/cert-manager \
  -n cert-manager \
  --version v1.14.0 \
  --set installCRDs=true
```

---

## Quick Reference

### Port map

| Service | Internal port | Helm service name |
|---------|-------------|-------------------|
| Frontend | 3000 | `frontend` |
| Auth | 4001 | `auth-service` |
| Prompt | 4002 | `prompt-service` |
| AI Execution | 4003 | `ai-execution` |
| Playground | 4004 | `playground` |
| Search | 4005 | `search-service` |
| Analytics | 4006 | `analytics` |
| User | 4007 | `user-service` |
| Marketplace | 4008 | `marketplace` |

### Namespace map

| Namespace | Contents |
|-----------|---------|
| `promptforge-prod` | All production workloads |
| `promptforge-staging` | All staging workloads |
| `cert-manager` | TLS certificate management |
| `ingress-nginx` | Ingress controller |
| `monitoring` | Prometheus, Grafana, Loki |

### Essential kubectl aliases

```bash
alias kp='kubectl get pods -n promptforge-prod'
alias kl='kubectl logs -n promptforge-prod'
alias ke='kubectl exec -it -n promptforge-prod'
alias kd='kubectl describe -n promptforge-prod'
alias kr='kubectl rollout restart deployment'
```
