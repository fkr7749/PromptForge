terraform {
  required_version = ">= 1.6"
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 5.0"
    }
  }
}

provider "oci" {
  tenancy_ocid     = var.tenancy_ocid
  user_ocid        = var.user_ocid
  fingerprint      = var.fingerprint
  private_key_path = var.private_key_path
  region           = var.region
}

locals {
  common_tags = {
    project     = var.project_name
    environment = var.environment
    managed_by  = "terraform"
  }
}

module "networking" {
  source         = "./modules/networking"
  compartment_id = var.compartment_id
  project_name   = var.project_name
  environment    = var.environment
  common_tags    = local.common_tags
}

module "compute" {
  source               = "./modules/compute"
  compartment_id       = var.compartment_id
  project_name         = var.project_name
  environment          = var.environment
  region               = var.region
  ssh_public_key       = var.ssh_public_key
  public_subnet_id     = module.networking.public_subnet_id
  private_subnet_id    = module.networking.private_subnet_id
  control_plane_ocpus  = var.control_plane_ocpus
  control_plane_memory_gb = var.control_plane_memory_gb
  worker_ocpus         = var.worker_ocpus
  worker_memory_gb     = var.worker_memory_gb
  worker_count         = var.worker_count
  common_tags          = local.common_tags
}

module "loadbalancer" {
  source         = "./modules/loadbalancer"
  compartment_id = var.compartment_id
  project_name   = var.project_name
  environment    = var.environment
  subnet_id      = module.networking.public_subnet_id
  worker_ips     = module.compute.worker_private_ips
  common_tags    = local.common_tags
}

module "storage" {
  source         = "./modules/storage"
  compartment_id = var.compartment_id
  project_name   = var.project_name
  environment    = var.environment
  common_tags    = local.common_tags
}
