# Production deployment runbook

This runbook creates the live AWS environment and connects GitHub Actions to it without long-lived AWS keys.

## 1. Prerequisites

- An AWS account with permission to create VPC, EKS, EC2, IAM, NAT, and load-balancer resources
- A public GitHub repository containing this project
- Terraform 1.10+, AWS CLI v2, kubectl, and Helm 3
- A billing alert in AWS before provisioning

## 2. Provision AWS with Terraform

Authenticate the AWS CLI using IAM Identity Center or another temporary-credential method. Never put keys in this repository.

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Set `github_repository` in `terraform.tfvars` to `OWNER/REPOSITORY`, then:

```bash
terraform init
terraform fmt -check -recursive
terraform validate
terraform plan -out=beaconops.tfplan
terraform apply beaconops.tfplan
```

Capture screenshots of the non-empty plan, AWS VPC, and active EKS cluster. Save these GitHub settings from Terraform outputs:

- Secret `AWS_ROLE_ARN` = `github_actions_role_arn`
- Variable `AWS_REGION` = `ap-south-1`
- Variable `EKS_CLUSTER_NAME` = `cluster_name`

## 3. Configure GitHub Actions

In **Repository settings → Secrets and variables → Actions**, add:

| Type | Name | Value |
|---|---|---|
| Secret | `AWS_ROLE_ARN` | Terraform output role ARN |
| Secret | `POSTGRES_PASSWORD` | 24+ character random password |
| Secret | `GRAFANA_ADMIN_PASSWORD` | A different 24+ character random password |
| Secret (only for private packages) | `GHCR_PULL_TOKEN` | Fine-grained token with Packages read |
| Variable | `AWS_REGION` | `ap-south-1` |
| Variable | `EKS_CLUSTER_NAME` | Terraform cluster name |
| Variable | `ENABLE_DEPLOYMENT` | `true` |

For a public submission, set both GHCR packages to public after the first publish. That removes the need for a long-lived pull token in the cluster.

## 4. Deploy

Push a meaningful commit to `main` or run the workflow manually. The workflow:

1. runs all API tests and the frontend production build;
2. builds both images;
3. blocks on HIGH/CRITICAL Trivy findings;
4. publishes full-SHA tags to GHCR;
5. assumes the AWS role using GitHub OIDC;
6. installs ingress-nginx, Metrics Server, Prometheus, and Grafana;
7. performs an atomic Helm upgrade and waits for all workloads.

Retrieve the public endpoint:

```bash
kubectl get service ingress-nginx-controller -n ingress-nginx
```

Open the hostname in `EXTERNAL-IP`. No local application process is involved.

## 5. Verify the release

```bash
kubectl get pods -n beaconops
kubectl get services -n beaconops
kubectl get ingress -n beaconops
kubectl get hpa -n beaconops
helm list -n beaconops
kubectl rollout status deployment/beaconops-beaconops-backend -n beaconops
kubectl rollout status deployment/beaconops-beaconops-frontend -n beaconops
```

Confirm metrics directly:

```bash
kubectl port-forward -n beaconops service/beaconops-beaconops-backend 8000:8000
curl http://127.0.0.1:8000/metrics
```

Open Prometheus and Grafana for evaluation:

```bash
kubectl port-forward -n monitoring service/kube-prometheus-stack-prometheus 9090:9090
kubectl port-forward -n monitoring service/kube-prometheus-stack-grafana 3001:80
```

Prometheus: `http://127.0.0.1:9090/targets` (BeaconOps target must be UP). Grafana: `http://127.0.0.1:3001`, then open **BeaconOps Application Health**.

## 6. Demonstrate HPA

Run the controlled load generator from a machine that can reach the application URL:

```bash
REQUESTS=20000 CONCURRENCY=60 ./scripts/load-test.sh http://APPLICATION_HOST/api/incidents
kubectl get hpa -n beaconops --watch
```

Scaling depends on sustained CPU usage and Metrics Server data; it is normal for a single health request not to trigger scaling.

## 7. Demonstrate troubleshooting

Broken image:

```bash
kubectl apply -f troubleshooting/broken-image.yaml
kubectl get pods -n beaconops
kubectl describe pod -n beaconops -l app=beaconops-broken-image
kubectl delete -f troubleshooting/broken-image.yaml
```

Broken Service selector:

```bash
kubectl apply -f troubleshooting/broken-service.yaml
kubectl get endpoints beaconops-broken-service -n beaconops
kubectl get pods -n beaconops --show-labels
kubectl delete -f troubleshooting/broken-service.yaml
```

## 8. Cost-safe teardown

Delete LoadBalancer services before destroying the VPC:

```bash
helm uninstall beaconops -n beaconops
helm uninstall kube-prometheus-stack -n monitoring
helm uninstall ingress-nginx -n ingress-nginx
helm uninstall metrics-server -n kube-system
kubectl get services --all-namespaces
cd terraform
terraform destroy
```

Capture the successful destroy output for grading and verify in AWS that EKS, NAT gateway, EC2 nodes, load balancers, and EBS volumes are gone.
