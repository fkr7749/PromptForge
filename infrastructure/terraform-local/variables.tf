variable "app_name" {
  description = "Application name used for labelling Kubernetes resources"
  type        = string
  default     = "promptforge"
}

variable "namespace" {
  description = "Kubernetes namespace to deploy into"
  type        = string
  default     = "promptforge"
}

variable "image" {
  description = "Docker image to deploy (e.g. ghcr.io/fkr7749/promptforge-frontend:latest)"
  type        = string
  default     = "ghcr.io/fkr7749/promptforge-frontend:latest"
}

variable "replicas" {
  description = "Number of pod replicas"
  type        = number
  default     = 1
}

variable "port" {
  description = "Container port the frontend listens on"
  type        = number
  default     = 3000
}
