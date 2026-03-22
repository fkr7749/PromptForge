variable "compartment_id" { type = string }
variable "project_name"   { type = string }
variable "environment"    { type = string }
variable "subnet_id"      { type = string }
variable "worker_ips"     { type = list(string) }
variable "common_tags"    { type = map(string) }
