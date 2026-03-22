output "control_plane_public_ip" {
  value = oci_core_instance.control_plane.public_ip
}

output "worker_public_ips" {
  value = oci_core_instance.workers[*].public_ip
}

output "worker_private_ips" {
  value = oci_core_instance.workers[*].private_ip
}
