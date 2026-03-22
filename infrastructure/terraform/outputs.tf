output "control_plane_public_ip" {
  description = "Public IP of the K8s control plane node"
  value       = module.compute.control_plane_public_ip
}

output "worker_public_ips" {
  description = "Public IPs of the K8s worker nodes"
  value       = module.compute.worker_public_ips
}

output "load_balancer_ip" {
  description = "Public IP of the OCI Load Balancer (point your domain DNS here)"
  value       = module.loadbalancer.load_balancer_ip
}

output "object_storage_bucket" {
  description = "Name of the object storage bucket"
  value       = module.storage.bucket_name
}

output "ansible_inventory" {
  description = "Ready-to-paste content for infrastructure/ansible/inventory/production.ini"
  value = <<-EOT
    [control_plane]
    promptforge-control ansible_host=${module.compute.control_plane_public_ip} ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/promptforge_oracle

    [workers]
    %{ for i, ip in module.compute.worker_public_ips ~}
    promptforge-worker-${i + 1} ansible_host=${ip} ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/promptforge_oracle
    %{ endfor ~}

    [k8s_cluster:children]
    control_plane
    workers
  EOT
}

output "next_steps" {
  description = "What to do after terraform apply"
  value = <<-EOT
    ✅ Infrastructure provisioned!

    1. Update Ansible inventory:
       Copy the 'ansible_inventory' output above into:
       infrastructure/ansible/inventory/production.ini

    2. Point your domain DNS → ${module.loadbalancer.load_balancer_ip}

    3. Run Ansible:
       cd infrastructure/ansible
       ansible-playbook -i inventory/production.ini playbooks/site.yml

    4. Get kubeconfig (after Ansible completes):
       ssh ubuntu@${module.compute.control_plane_public_ip} "sudo cat /etc/rancher/k3s/k3s.yaml" | \
         sed 's/127.0.0.1/${module.compute.control_plane_public_ip}/g' > kubeconfig.yaml
       base64 -w 0 kubeconfig.yaml  → add as KUBECONFIG_PRODUCTION GitHub secret
  EOT
}
