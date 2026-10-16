variable "aws_region" {
  description = "AWS region for the BeaconOps infrastructure."
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Short project name used in AWS resource names."
  type        = string
  default     = "beaconops"
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "production"
}

variable "kubernetes_version" {
  description = "Supported Amazon EKS Kubernetes version."
  type        = string
  default     = "1.37"
}

variable "vpc_cidr" {
  description = "CIDR assigned to the application VPC."
  type        = string
  default     = "10.42.0.0/16"
}

variable "node_instance_types" {
  description = "EC2 instance types for the managed worker node group."
  type        = list(string)
  default     = ["t3.medium"]
}

variable "node_min_size" {
  type    = number
  default = 2
}

variable "node_desired_size" {
  type    = number
  default = 2
}

variable "node_max_size" {
  type    = number
  default = 4
}

variable "github_repository" {
  description = "Optional owner/repository allowed to assume the deploy role through GitHub OIDC."
  type        = string
  default     = ""
}

variable "github_repository_owner_id" {
  description = "Immutable GitHub owner ID used in OIDC subjects for repositories created after July 15, 2026."
  type        = string
  default     = ""
}

variable "github_repository_id" {
  description = "Immutable GitHub repository ID used in OIDC subjects for repositories created after July 15, 2026."
  type        = string
  default     = ""
}

variable "github_oidc_provider_arn" {
  description = "Existing GitHub Actions OIDC provider ARN. Leave empty to create one when github_repository is set."
  type        = string
  default     = ""
}
