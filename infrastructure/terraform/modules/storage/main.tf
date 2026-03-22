data "oci_objectstorage_namespace" "main" {
  compartment_id = var.compartment_id
}

resource "oci_objectstorage_bucket" "uploads" {
  compartment_id = var.compartment_id
  namespace      = data.oci_objectstorage_namespace.main.namespace
  name           = "${var.project_name}-uploads-${var.environment}"
  access_type    = "NoPublicAccess"
  storage_tier   = "Standard"
  freeform_tags  = var.common_tags
}
