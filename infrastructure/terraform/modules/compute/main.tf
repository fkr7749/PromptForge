data "oci_identity_availability_domains" "ads" {
  compartment_id = var.compartment_id
}

data "oci_core_images" "ubuntu_arm" {
  compartment_id           = var.compartment_id
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "22.04"
  shape                    = "VM.Standard.A1.Flex"
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"

  filter {
    name   = "display_name"
    values = [".*aarch64.*"]
    regex  = true
  }
}

locals {
  ad_name    = data.oci_identity_availability_domains.ads.availability_domains[0].name
  image_id   = data.oci_core_images.ubuntu_arm.images[0].id
}

resource "oci_core_instance" "control_plane" {
  availability_domain = local.ad_name
  compartment_id      = var.compartment_id
  display_name        = "${var.project_name}-control-plane"
  shape               = "VM.Standard.A1.Flex"
  freeform_tags       = var.common_tags

  shape_config {
    ocpus         = var.control_plane_ocpus
    memory_in_gbs = var.control_plane_memory_gb
  }

  source_details {
    source_type = "image"
    source_id   = local.image_id
    boot_volume_size_in_gbs = 100
  }

  create_vnic_details {
    subnet_id        = var.public_subnet_id
    assign_public_ip = true
    display_name     = "${var.project_name}-control-vnic"
    hostname_label   = "${var.project_name}-control"
  }

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
    user_data           = base64encode(file("${path.module}/../../cloud-init/k8s-control.yaml"))
  }
}

resource "oci_core_instance" "workers" {
  count               = var.worker_count
  availability_domain = local.ad_name
  compartment_id      = var.compartment_id
  display_name        = "${var.project_name}-worker-${count.index + 1}"
  shape               = "VM.Standard.A1.Flex"
  freeform_tags       = var.common_tags

  shape_config {
    ocpus         = var.worker_ocpus
    memory_in_gbs = var.worker_memory_gb
  }

  source_details {
    source_type             = "image"
    source_id               = local.image_id
    boot_volume_size_in_gbs = 50
  }

  create_vnic_details {
    subnet_id        = var.public_subnet_id
    assign_public_ip = true
    display_name     = "${var.project_name}-worker-${count.index + 1}-vnic"
    hostname_label   = "${var.project_name}-worker-${count.index + 1}"
  }

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
  }
}
