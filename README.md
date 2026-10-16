# BeaconOps - Production Incident Command Center

[![BeaconOps CI/CD](https://github.com/Kabeer-Scaler/beaconops-capstone/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Kabeer-Scaler/beaconops-capstone/actions/workflows/ci-cd.yml)

BeaconOps is a full-stack incident-management platform for production operations teams. Responders can declare an incident, assign a commander, classify severity, advance the response lifecycle, filter the active queue, and review operational statistics. The application is delivered through a tested, security-scanned CI/CD pipeline to Amazon EKS and is monitored with Prometheus and Grafana.

Repository: [github.com/Kabeer-Scaler/beaconops-capstone](https://github.com/Kabeer-Scaler/beaconops-capstone)

Verified production pipeline: [GitHub Actions run #9](https://github.com/Kabeer-Scaler/beaconops-capstone/actions/runs/38919476385) deployed commit `6a1f963578ab82814efa4bb3a767c23d4ac00c1f` successfully.

## What is included

- Responsive React incident-command dashboard
- FastAPI CRUD and statistics API
- PostgreSQL persistence with SQLAlchemy and Alembic
- Eight isolated Pytest API tests
- Multi-stage, non-root backend and frontend containers
- Three-service Docker Compose stack
- GitHub Actions test, build, scan, publish, and deploy pipeline
- Trivy HIGH/CRITICAL container security gates
- SHA-tagged images in GitHub Container Registry (GHCR)
- Terraform-managed AWS VPC, networking, IAM, EKS, and worker nodes
- GitHub OIDC authentication without stored AWS access keys
- Helm-managed Deployments, Services, Ingress, PostgreSQL, HPA, probes, PDBs, and secrets
- Prometheus ServiceMonitor and an auto-provisioned Grafana dashboard
- Controlled autoscaling and troubleshooting exercises

## Architecture

```text
Developer
   |
   | git push to main
   v
GitHub Actions
   |-- Pytest + Python compile check
   |-- React/Vite production build
   |-- Build backend and frontend images
   |-- Trivy HIGH/CRITICAL security gates
   |-- Push full-SHA tags to GHCR
   `-- Assume AWS role through GitHub OIDC
                         |
                         v
Terraform             Amazon EKS
   |                     |
   |-- VPC (2 AZs)       |-- ingress-nginx -> AWS Network Load Balancer
   |-- 2 public subnets  |                     |
   |-- 2 private subnets |              Kubernetes Ingress
   |-- NAT gateway       |                 /          /api
   |-- IAM/OIDC          |                 |            |
   `-- worker node group |          React/Nginx     FastAPI
                         |            2 Pods       2-6 Pods (HPA)
                         |                              |
                         |                  PostgreSQL StatefulSet
                         |                     5 Gi EBS PVC
                         |
                         `-- Prometheus <- ServiceMonitor <- /metrics
                                      |
                                   Grafana
```

The EKS control plane and worker group are created by Terraform. Application and platform workloads are reconciled by Helm from the deployment job. Worker nodes are private; the public subnets are reserved for internet-facing load balancers.

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, responsive CSS, unprivileged Nginx |
| Backend | Python 3.12, FastAPI, Uvicorn, Pydantic |
| Data | PostgreSQL 16 Alpine, SQLAlchemy 2, Alembic, EBS persistent storage |
| Testing | Pytest, FastAPI TestClient, isolated SQLite test database |
| Containers | Docker multi-stage builds, Docker Compose, GHCR |
| CI/CD | GitHub Actions, Docker Buildx, Trivy, GitHub OIDC |
| Infrastructure | Terraform 1.10+, AWS provider 6.x, VPC, IAM, EKS, EC2, EBS, NLB |
| Kubernetes | EKS 1.37, Helm 3, ingress-nginx, Metrics Server, HPA |
| Observability | Prometheus Operator, ServiceMonitor, Grafana, Alertmanager |

## Repository structure

```text
backend/
  app/                         FastAPI routes, models, schemas, and DB configuration
  alembic/versions/            Versioned database migration
  tests/                       Eight API tests and isolated DB fixtures
  Dockerfile                   Multi-stage non-root Python image
frontend/
  src/                         React dashboard, API client, and responsive styles
  nginx.conf                   Static hosting, health check, and Compose API proxy
  Dockerfile                   Node build -> unprivileged Nginx runtime
.github/workflows/ci-cd.yml    Test -> build -> scan -> publish -> deploy
terraform/                     AWS VPC, IAM/OIDC, EKS, nodes, and EBS CSI identity
helm/beaconops/                Complete application Helm chart
k8s/namespace.yaml             Restricted beaconops namespace manifest
monitoring/                    kube-prometheus-stack production values
scripts/load-test.sh           Controlled HPA load generator
troubleshooting/               Broken image and Service selector exercises
docs/DEPLOYMENT.md             Detailed deployment runbook
docs/EVIDENCE.md               Screenshot and demo evidence checklist
docs/RUBRIC-CHECKLIST.md       Criterion-to-implementation mapping
docker-compose.yml             Local frontend, backend, and PostgreSQL stack
```

## Application and API

The frontend uses relative `/api` requests. In production, Kubernetes Ingress sends `/` to the frontend Service and `/api` to the backend Service. The browser never needs an internal Kubernetes hostname.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/` | API identity and version |
| `GET` | `/health` | Lightweight liveness response |
| `GET` | `/ready` | Readiness response after a database query |
| `GET` | `/metrics` | Prometheus-formatted application metrics |
| `GET` | `/api/incidents` | List incidents, optionally filtered by status/severity |
| `GET` | `/api/incidents/{id}` | Retrieve one incident |
| `POST` | `/api/incidents` | Declare an incident |
| `PUT` | `/api/incidents/{id}` | Update status, commander, or incident data |
| `DELETE` | `/api/incidents/{id}` | Delete an incident |
| `GET` | `/api/incidents/stats` | Return dashboard KPIs |

Swagger/OpenAPI is available at `/docs`. Kubernetes probes use `/health`, `/ready`, and the frontend `/healthz` endpoint.

## Local evaluator setup with Docker Compose

Production runs on EKS; Docker Compose is retained as the rubric-required one-command reproduction path.

Requirements:

- Docker Desktop or Docker Engine with Compose v2
- Ports `3000` and `8000` available

Start all three services:

```bash
docker compose up --build
```

Open:

- Frontend: `http://localhost:3000`
- Swagger: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`
- Metrics: `http://localhost:8000/metrics`

Check container health:

```bash
docker compose ps
curl http://localhost:8000/health
```

Stop the stack:

```bash
docker compose down
```

To also delete the local database volume:

```bash
docker compose down -v
```

The Compose password defaults are development-only. Use environment variables for any shared environment.

## Tests and quality gates

The test configuration overrides `DATABASE_URL` with `sqlite:///./beaconops-test.db`. The autouse fixture recreates the schema for every test, so tests never access production PostgreSQL.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate       # Windows PowerShell: .\.venv\Scripts\Activate.ps1
python -m pip install --requirement requirements.txt
pytest -v
```

The eight tests cover health/readiness, metrics, create, list/filter, retrieve, update, delete, statistics, validation, and missing resources. CI also compile-checks the Python source and runs a clean Vite production build.

## Container design and security

Both application images use multi-stage builds:

- The backend installs dependencies into a virtual environment in a builder stage, removes packaging tools from the runtime, and runs as numeric UID/GID `10001`.
- The frontend builds static assets with Node and serves only the build output from `nginxinc/nginx-unprivileged` as UID/GID `101`.
- Kubernetes blocks privilege escalation, drops Linux capabilities, enables `RuntimeDefault` seccomp, and uses read-only root filesystems where practical.
- PostgreSQL runs non-root as Alpine UID/GID `70`; `PGDATA` uses an owned child directory on the EBS volume.
- Runtime configuration and database credentials come from Kubernetes Secrets, never from an image.

Trivy scans operating-system packages and application dependencies in both built images. A HIGH or CRITICAL result exits with code `1`, preventing publication and deployment. A clean scan means no matching findings were present in Trivy's vulnerability database at scan time; it is not a guarantee that the image has no security risk.

## AWS infrastructure with Terraform

Terraform provisions:

- One VPC across two Availability Zones
- Two public subnets tagged for internet-facing load balancers
- Two private subnets for EKS worker nodes
- One NAT gateway for private-node egress
- Amazon EKS 1.37 control plane
- Managed `t3.medium` worker group with desired/minimum `2` and maximum `4`
- CoreDNS, kube-proxy, VPC CNI, Pod Identity Agent, and EBS CSI add-ons
- Dedicated EBS CSI Pod Identity role and AWS-managed policy
- GitHub Actions OIDC provider, least-purpose deploy role, and EKS access entry

### Prerequisites

- AWS account with VPC, EC2, EKS, IAM, EBS, and load-balancer permissions
- AWS CLI v2 authenticated with temporary credentials or IAM Identity Center
- Terraform 1.10+, kubectl, and Helm 3
- Public GitHub repository and a billing alert

### Configure variables

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Set `github_repository` to `OWNER/REPOSITORY`. Repositories created after July 15, 2026 use GitHub immutable OIDC subjects, so also set `github_repository_owner_id` and `github_repository_id`. These numeric IDs are available from the GitHub REST API. Do not put AWS credentials in this file.

`terraform.tfvars`, state files, plans, `.env` files, keys, virtual environments, and dependency folders are excluded by `.gitignore`.

### Provision

```bash
terraform init
terraform fmt -check -recursive
terraform validate
terraform plan -out=beaconops.tfplan
terraform apply beaconops.tfplan
```

Important outputs:

| Output | Use |
|---|---|
| `cluster_name` | GitHub `EKS_CLUSTER_NAME` variable |
| `cluster_endpoint` | EKS API endpoint |
| `github_actions_role_arn` | GitHub `AWS_ROLE_ARN` secret |
| `configure_kubectl` | Command to create the local kubeconfig context |
| `vpc_id` and subnet IDs | Infrastructure verification evidence |

The checked-in Terraform configuration passes `terraform fmt -check -recursive` and `terraform validate`. Capture the initial non-empty plan and AWS console resources for grading before teardown.

## GitHub configuration

Add the following under **Settings -> Secrets and variables -> Actions**.

### Secrets

| Name | Purpose |
|---|---|
| `AWS_ROLE_ARN` | Terraform-created OIDC deploy role ARN |
| `POSTGRES_PASSWORD` | Random production database password |
| `GRAFANA_ADMIN_PASSWORD` | Separate random Grafana administrator password |
| `GHCR_PULL_TOKEN` | Optional; only required while packages are private |

### Variables

| Name | Example |
|---|---|
| `AWS_REGION` | `ap-south-1` |
| `EKS_CLUSTER_NAME` | `beaconops-production-eks` |
| `ENABLE_DEPLOYMENT` | `true` |

The workflow requests `id-token: write` only for the deploy job. AWS exchanges the GitHub OIDC token for short-lived credentials; no long-lived AWS key is stored in GitHub or the repository.

## CI/CD pipeline

`.github/workflows/ci-cd.yml` runs on every push to `main` and can also be started manually.

```text
Test and build source
  -> Build, scan, and publish images
      -> Deploy to Amazon EKS
```

### 1. Test and build source

- Installs Python 3.12 dependencies
- Runs `pytest -v`
- Compile-checks backend source
- Installs Node 22 dependencies with `npm ci`
- Builds the React frontend

### 2. Build, scan, and publish images

- Builds backend and frontend images with Buildx
- Scans each image independently with Trivy
- Fails on HIGH or CRITICAL findings
- Authenticates to GHCR with the job-scoped `GITHUB_TOKEN`
- Pushes both images with the immutable full Git commit SHA; `latest` is not deployed

### 3. Deploy to EKS

- Assumes the AWS role through OIDC
- Configures kubectl for the Terraform-created cluster
- Installs/upgrades ingress-nginx, Metrics Server, and kube-prometheus-stack
- Creates an optional GHCR pull secret only when a token is supplied
- Performs an atomic Helm upgrade and waits for readiness
- Captures pod logs and Kubernetes events if an atomic deployment fails
- Publishes the Network Load Balancer URL to the GitHub production environment

Jobs use `needs` dependencies, so a failed test, build, or security scan prevents promotion.

## Kubernetes and Helm

The Helm release is named `beaconops` in namespace `beaconops`.

| Resource | Production behavior |
|---|---|
| Frontend Deployment | 2 replicas, probes, resource requests/limits, non-root Nginx |
| Backend Deployment | 2 replicas, migration init container, probes, resource requests/limits |
| Backend HPA | 2-6 replicas at 60% average CPU utilization |
| PostgreSQL StatefulSet | 1 replica, non-root, 5 Gi `gp2` EBS-backed PVC |
| Services | ClusterIP frontend/backend/database Services plus a stable backend alias |
| Ingress | `/` -> frontend; `/api`, `/docs`, `/openapi.json` -> backend |
| PDBs | Minimum one frontend and one backend Pod available during voluntary disruption |
| ServiceMonitor | Scrapes backend metrics every 15 seconds |
| Grafana dashboard | Provisioned through a labeled ConfigMap |

Manual chart validation:

```bash
helm lint ./helm/beaconops -f helm/beaconops/values-prod.yaml \
  --set-string postgresql.password=validation-only

helm template beaconops ./helm/beaconops -n beaconops \
  -f helm/beaconops/values-prod.yaml \
  --set-string postgresql.password=validation-only
```

Production verification:

```bash
kubectl get nodes
kubectl get pods,services,ingress,hpa -n beaconops
kubectl rollout status deployment/beaconops-beaconops-backend -n beaconops
kubectl rollout status deployment/beaconops-beaconops-frontend -n beaconops
helm list -n beaconops
```

Retrieve the public endpoint:

```bash
kubectl get service ingress-nginx-controller -n ingress-nginx
```

PowerShell can open it directly:

```powershell
$beaconopsHost = kubectl get service ingress-nginx-controller `
  -n ingress-nginx `
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
Start-Process "http://$beaconopsHost"
```

## Observability

`prometheus-fastapi-instrumentator` exposes Prometheus metrics at `/metrics`. The chart's ServiceMonitor selects the backend Service, and Prometheus discovers it across namespaces. Grafana's dashboard sidecar imports the `BeaconOps Application Health` dashboard automatically.

Dashboard panels include:

- HTTP request rate by method and handler
- p95 request latency
- Five-minute 5xx error count
- Ready backend replica count
- Backend CPU usage

Verify metrics:

```bash
kubectl port-forward -n beaconops service/beaconops-beaconops-backend 8000:8000
curl http://127.0.0.1:8000/metrics
```

Open Prometheus targets:

```bash
kubectl port-forward -n monitoring service/kube-prometheus-stack-prometheus 9090:9090
```

Open `http://127.0.0.1:9090/targets` and confirm the BeaconOps target is `UP`.

Open Grafana in a separate terminal:

```bash
kubectl port-forward -n monitoring service/kube-prometheus-stack-grafana 3001:80
```

Open `http://127.0.0.1:3001`, sign in with the configured administrator password, and select **BeaconOps Application Health**.

Generate controlled traffic before capturing the dashboard:

```bash
REQUESTS=20000 CONCURRENCY=60 ./scripts/load-test.sh \
  http://APPLICATION_HOST/api/incidents
kubectl get hpa -n beaconops --watch
```

## Troubleshooting and rollback

Start with these commands when a release is unhealthy:

```bash
kubectl get pods -n beaconops -o wide
kubectl get events -n beaconops --sort-by=.lastTimestamp
kubectl describe pod POD_NAME -n beaconops
kubectl logs POD_NAME -n beaconops --all-containers --previous
helm history beaconops -n beaconops
```

The deployment uses `--atomic`, so a failed upgrade rolls back automatically. The workflow concurrently retains diagnostic pod logs before Helm removes failed resources.

Two controlled exercises are included:

```bash
kubectl apply -f troubleshooting/broken-image.yaml
kubectl apply -f troubleshooting/broken-service.yaml
```

Delete each exercise after demonstrating the diagnosis:

```bash
kubectl delete -f troubleshooting/broken-image.yaml
kubectl delete -f troubleshooting/broken-service.yaml
```

## Cost-safe teardown

EKS, EC2 workers, NAT Gateway, EBS, and the Network Load Balancer incur charges. Keep the environment only for the evaluation window. Remove Kubernetes-created AWS resources before Terraform destroys the VPC.

```bash
helm uninstall beaconops -n beaconops
kubectl delete pvc --all -n beaconops
helm uninstall ingress-nginx -n ingress-nginx
helm uninstall kube-prometheus-stack -n monitoring
helm uninstall metrics-server -n kube-system
kubectl get services --all-namespaces
kubectl get pv
```

Wait for LoadBalancer Services and persistent volumes to disappear, then:

```bash
cd terraform
terraform destroy
```

Confirm the prompt only after reviewing the destroy plan. Capture `Destroy complete!` for the rubric and verify that EKS, EC2 workers, NAT Gateway, load balancers, and EBS volumes are gone. Finally set the GitHub variable `ENABLE_DEPLOYMENT=false` so later documentation commits do not attempt deployment to a deleted cluster.

## Evaluation evidence screenshots

The screenshots below were captured from the working repository, Docker Compose, the live AWS deployment, Kubernetes, Prometheus, Grafana, and the AWS Console on October 16-17, 2026. The complete evidence checklist is in [`screenshots/README.md`](screenshots/README.md).

### BeaconOps application running on Amazon EKS

![BeaconOps application running on Amazon EKS](screenshots/01-live-application-eks.png)

The production incident-command dashboard is loaded through the AWS Network Load Balancer and Kubernetes Ingress. The browser address bar shows the live `ap-south-1.elb.amazonaws.com` endpoint, while the page demonstrates the usable incident queue and operational dashboard.

### FastAPI incident-management API

![FastAPI incident-management API](screenshots/02-swagger-crud-api.png)

The live Swagger UI exposes system health/readiness routes and the incident-management REST surface, including GET, POST, PUT, and DELETE operations.

### FastAPI health check

![FastAPI health endpoint returning HTTP 200](screenshots/03-backend-health.png)

The deployed backend `/health` endpoint returns HTTP 200 with an `UP` status, proving that the API is live and responding through the Kubernetes workload.

### PostgreSQL incident persistence

![Incident record stored in PostgreSQL](screenshots/04-postgresql-incidents.png)

A query executed in the PostgreSQL pod returns the persisted incident record with its ID, title, service, severity, status, and commander.

### Successful GitHub Actions deployment

![Successful BeaconOps CI/CD workflow](screenshots/05-github-actions-success.png)

The successful workflow shows all three jobs in green: source testing, container build/security scan/publication, and deployment to Amazon EKS.

### Backend automated tests passing

![Eight backend tests passing](screenshots/06-pytest-eight-passed.png)

The real `python -m pytest -v` result shows all eight tests passing. Coverage includes health, readiness, metrics, incident creation, retrieval, filtering, update, deletion, statistics, validation, and not-found behavior.

### Meaningful Git commit history

![Meaningful Git commit history](screenshots/07-github-commit-history.png)

The public repository history shows a sequence of focused commits for the application, infrastructure, CI/CD remediation, security, and documentation instead of a single bulk submission.

### Sensitive and generated files excluded from Git

![Secure gitignore configuration](screenshots/08-gitignore-security.png)

The root `.gitignore` excludes environment files, private keys, Terraform state and plans, dependency folders, test artifacts, logs, and private evidence material.

### Docker Compose services healthy

![Three healthy Docker Compose services](screenshots/09-docker-compose-services.png)

The real `docker compose ps` result shows the frontend, backend, and PostgreSQL containers running with healthy status.

### BeaconOps running through Docker Compose

![BeaconOps running at localhost through Docker Compose](screenshots/10-docker-compose-browser.png)

The complete incident-command interface loads at `http://localhost:3000`, proving the repository's one-command local reproduction path.

### Frontend image published to GHCR

![Frontend container image in GHCR](screenshots/11-ghcr-frontend-sha.png)

The public `beaconops-frontend` package contains the immutable full Git commit SHA tag produced by the successful CI/CD run.

### Backend image published to GHCR

![Backend container image in GHCR](screenshots/12-ghcr-backend-sha.png)

The public `beaconops-backend` package contains the same immutable full-SHA release tag, allowing the Kubernetes deployment to reference an auditable build rather than `latest`.

### Trivy container security gates passed

![Backend and frontend Trivy scans passed](screenshots/13-trivy-backend-frontend-scans.png)

The successful GitHub Actions image job shows checkmarks for both the backend and frontend Trivy scans before the registry sign-in and `Push SHA-tagged images` step. This proves that both release images passed the configured HIGH/CRITICAL vulnerability gate before publication.

### Terraform infrastructure plan

![Terraform non-empty infrastructure plan](screenshots/15-terraform-plan.png)

The saved deployment plan contains the real AWS VPC, public/private subnet, EKS, managed-node-group, add-on, IAM, and GitHub OIDC resources, with `63 to add, 0 to change, 0 to destroy`.

### EKS worker nodes ready

![Two Amazon EKS worker nodes ready](screenshots/16-eks-worker-nodes-ready.png)

Both managed worker nodes are in the Kubernetes `Ready` state and run the expected Amazon EKS Kubernetes version.

### BeaconOps Kubernetes resources

![BeaconOps pods services ingress and HPA](screenshots/17-beaconops-kubernetes-resources.png)

The `beaconops` namespace shows running application and database pods, ClusterIP Services, the public NGINX Ingress address, and the backend HPA configured for two to six replicas.

### Monitoring workloads running

![Prometheus and Grafana monitoring pods running](screenshots/18-monitoring-pods-running.png)

Alertmanager, Grafana, kube-state-metrics, Prometheus Operator, node exporters, and Prometheus are all running in the `monitoring` namespace.

### BeaconOps VPC resource map

![BeaconOps AWS VPC resource map](screenshots/19-aws-vpc-resource-map.png)

The AWS VPC console shows the available `10.42.0.0/16` production VPC, four subnets split into public and private tiers across `ap-south-1a` and `ap-south-1b`, separate route tables, an Internet Gateway, and a NAT Gateway.

### Amazon EKS control plane active

![BeaconOps Amazon EKS cluster active](screenshots/20-aws-eks-cluster-active.png)

The AWS EKS console shows `beaconops-production-eks` in the `Active` state in Asia Pacific (Mumbai), running Kubernetes 1.37 with its API endpoint and OIDC provider configured.

### EKS managed node group active

![BeaconOps EKS managed node group active](screenshots/21-aws-managed-nodegroup-active.png)

The EKS Compute page shows the Terraform-managed `beaconops-workers` node group in the `Active` state with desired capacity two and no node health issues.

### Required EKS add-ons active

![BeaconOps EKS add-ons active](screenshots/22-aws-eks-addons-active.png)

The EKS Add-ons page shows the Amazon EBS CSI Driver, EKS Pod Identity Agent, Amazon VPC CNI, CoreDNS, and kube-proxy installed and healthy. This also provides direct evidence that the storage add-on issue encountered during provisioning was resolved.

### Helm release deployed

![BeaconOps Helm release deployed](screenshots/22-helm-release-deployed.png)

`helm list -n beaconops` shows the `beaconops` release in `deployed` status with chart and application version `1.0.0`.

### Prometheus application metrics

![Prometheus metrics exposed by FastAPI](screenshots/23-prometheus-metrics-output.png)

The backend `/metrics` endpoint exposes Prometheus-formatted request counters, duration histograms, and process metrics.

### Prometheus target healthy

![Prometheus scraping all BeaconOps targets](screenshots/24-prometheus-target-up.png)

Prometheus discovers the BeaconOps ServiceMonitor and reports all four backend scrape endpoints as `UP`.

### Grafana application-health dashboard

![Populated BeaconOps Grafana dashboard](screenshots/25-grafana-dashboard.png)

The provisioned dashboard displays request rate, p95 latency, ready backend replicas, and CPU usage. The 5xx panel correctly has no error-series data during the healthy observation window.

## Grading and evidence status

The repository implementation covers all ten grading modules. The following facts were verified during the final audit:

- Public GitHub repository with 22 meaningful commits at audit time
- Eight API tests across more than three endpoints using an isolated SQLite database
- Multi-stage, numeric non-root backend and frontend images
- Successful public pipeline with test, frontend build, two image builds, two Trivy gates, two GHCR pushes, and EKS deployment
- Exact backend and frontend SHA manifests anonymously pullable from GHCR
- Terraform formatting and validation successful
- Helm lint and production template rendering successful
- Live application reachable through the AWS Network Load Balancer

The evidence gallery above contains every requested runtime screenshot except the intentionally deferred Terraform teardown. After the evaluation and demo are complete, run the documented teardown, capture `terraform destroy` completion as `screenshots/26-terraform-destroy-complete.png`, and mark the final item in [`screenshots/README.md`](screenshots/README.md).

Use [`docs/EVIDENCE.md`](docs/EVIDENCE.md) for the recording order and [`docs/RUBRIC-CHECKLIST.md`](docs/RUBRIC-CHECKLIST.md) for the complete point-by-point mapping.

## Production trade-offs

PostgreSQL runs inside Kubernetes to satisfy the capstone's full-stack and persistent-volume requirements. A longer-lived production environment would normally evaluate Amazon RDS, TLS termination with ACM, external secret management, multiple NAT gateways, remote Terraform state with locking, backup/restore policies, and separate staging/production environments.
