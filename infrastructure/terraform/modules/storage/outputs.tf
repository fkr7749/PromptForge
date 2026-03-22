output "bucket_name" { value = oci_objectstorage_bucket.uploads.name }
output "namespace"   { value = data.oci_objectstorage_namespace.main.namespace }
