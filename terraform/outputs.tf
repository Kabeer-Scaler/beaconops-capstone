output "cluster_name" {
  description = "EKS cluster name."
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "EKS control-plane endpoint."
  value       = module.eks.cluster_endpoint
}

output "vpc_id" {
  description = "Provisioned VPC ID."
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "Public subnet IDs used by internet-facing load balancers."
  value       = module.vpc.public_subnets
}

output "private_subnet_ids" {
  description = "Private subnet IDs used by EKS workers."
  value       = module.vpc.private_subnets
}

output "github_actions_role_arn" {
  description = "Set this value as the AWS_ROLE_ARN GitHub Actions secret."
  value       = var.github_repository == "" ? null : aws_iam_role.github_deploy[0].arn
}

output "configure_kubectl" {
  description = "Command that configures kubectl for this cluster."
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_name}"
}
