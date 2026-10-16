# BeaconOps AWS infrastructure

Terraform provisions a VPC across two Availability Zones, two public subnets, two private subnets, one NAT gateway, an Amazon EKS 1.37 control plane, and a managed worker node group with 2–4 nodes. Public subnets are tagged for the Ingress load balancer; workers run in private subnets.

## Apply

```bash
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform fmt -check -recursive
terraform validate
terraform plan -out=beaconops.tfplan
terraform apply beaconops.tfplan
aws eks update-kubeconfig --region ap-south-1 --name beaconops-production-eks
```

Never place AWS keys in Terraform files or commit `terraform.tfvars`, state, or plan files.

## Destroy after evaluation

Delete Kubernetes LoadBalancer services first so AWS removes their load balancers, then destroy the infrastructure:

```bash
helm uninstall beaconops -n beaconops
helm uninstall ingress-nginx -n ingress-nginx
terraform destroy
```

EKS, worker nodes, NAT gateway, and load balancers incur charges while running.
