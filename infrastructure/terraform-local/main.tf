terraform {
  required_version = ">= 1.6"
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.27"
    }
  }
}

# Uses ~/.kube/config automatically (points to minikube after `minikube start`)
provider "kubernetes" {
  config_path    = "~/.kube/config"
  config_context = "minikube"
}

# ── Namespace ───────────────────────────────────────────────────────────────

resource "kubernetes_namespace" "promptforge" {
  metadata {
    name = var.namespace
    labels = {
      app        = var.app_name
      managed_by = "terraform"
    }
  }
}

# ── Deployment ──────────────────────────────────────────────────────────────

resource "kubernetes_deployment" "frontend" {
  metadata {
    name      = "${var.app_name}-frontend"
    namespace = kubernetes_namespace.promptforge.metadata[0].name
    labels = {
      app       = var.app_name
      component = "frontend"
    }
  }

  spec {
    replicas = var.replicas

    selector {
      match_labels = {
        app       = var.app_name
        component = "frontend"
      }
    }

    template {
      metadata {
        labels = {
          app       = var.app_name
          component = "frontend"
        }
      }

      spec {
        container {
          name  = "frontend"
          image = var.image

          port {
            container_port = var.port
          }

          env {
            name  = "NODE_ENV"
            value = "production"
          }

          env {
            name  = "PORT"
            value = tostring(var.port)
          }

          resources {
            requests = {
              cpu    = "100m"
              memory = "256Mi"
            }
            limits = {
              cpu    = "500m"
              memory = "512Mi"
            }
          }

          liveness_probe {
            http_get {
              path = "/api/health"
              port = var.port
            }
            initial_delay_seconds = 30
            period_seconds        = 15
          }

          readiness_probe {
            http_get {
              path = "/api/health"
              port = var.port
            }
            initial_delay_seconds = 10
            period_seconds        = 10
          }
        }
      }
    }
  }
}

# ── Service ─────────────────────────────────────────────────────────────────

resource "kubernetes_service" "frontend" {
  metadata {
    name      = "${var.app_name}-frontend"
    namespace = kubernetes_namespace.promptforge.metadata[0].name
    labels = {
      app       = var.app_name
      component = "frontend"
    }
  }

  spec {
    selector = {
      app       = var.app_name
      component = "frontend"
    }

    type = "NodePort"

    port {
      name        = "http"
      port        = var.port
      target_port = var.port
      node_port   = 30080
    }
  }
}
