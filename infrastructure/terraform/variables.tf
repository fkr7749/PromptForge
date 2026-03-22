variable "tenancy_ocid" {
  description = "OCID of your OCI tenancy"
  type        = string
}

variable "user_ocid" {
  description = "OCID of the OCI user for API access"
  type        = string
}

variable "fingerprint" {
  description = "Fingerprint of the OCI API key"
  type        = string
}

variable "private_key_path" {
  description = "Local path to the OCI API private key .pem file"
  type        = string
  default     = "~/.oci/oci_api_key.pem"
}

variable "region" {
  description = "OCI region identifier (e.g. us-ashburn-1)"
  type        = string
}

variable "compartment_id" {
  description = "OCID of the compartment to deploy into"
  type        = string
}

variable "ssh_public_key" {
  description = "SSH public key for VM access (content of ~/.ssh/promptforge_oracle.pub)"
  type        = string
}

variable "project_name" {
  description = "Project name used for resource naming and tagging"
  type        = string
  default     = "promptforge"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "control_plane_ocpus" {
  description = "OCPUs for the K8s control plane VM (free tier max: 4 total)"
  type        = number
  default     = 2
}

variable "control_plane_memory_gb" {
  description = "Memory GB for the control plane VM"
  type        = number
  default     = 12
}

variable "worker_ocpus" {
  description = "OCPUs per worker node"
  type        = number
  default     = 1
}

variable "worker_memory_gb" {
  description = "Memory GB per worker node"
  type        = number
  default     = 6
}

variable "worker_count" {
  description = "Number of worker nodes (2 recommended for HA)"
  type        = number
  default     = 2
}
