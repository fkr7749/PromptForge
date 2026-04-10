output "namespace" {
  description = "Kubernetes namespace where the app is deployed"
  value       = kubernetes_namespace.promptforge.metadata[0].name
}

output "deployment_name" {
  description = "Name of the Kubernetes Deployment"
  value       = kubernetes_deployment.frontend.metadata[0].name
}

output "service_name" {
  description = "Name of the Kubernetes Service"
  value       = kubernetes_service.frontend.metadata[0].name
}

output "node_port" {
  description = "NodePort exposed on the Minikube node"
  value       = kubernetes_service.frontend.spec[0].port[0].node_port
}

output "access_url_hint" {
  description = "Run this command to get the app URL from Minikube"
  value       = "minikube service ${kubernetes_service.frontend.metadata[0].name} -n ${kubernetes_namespace.promptforge.metadata[0].name} --url"
}
