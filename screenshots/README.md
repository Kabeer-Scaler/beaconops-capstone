# BeaconOps Grading Screenshots

Use this folder for the final evidence images. Replace each `[ ]` with `[x]` after saving the screenshot using the filename shown.

Do not include AWS credentials, GitHub secrets, database passwords, Grafana passwords, `.env`, or `terraform.tfvars` in any screenshot.

## Screenshots supplied by the project owner

These four existing images have been copied into this folder using the required filenames.

### [x] `05-github-actions-success.png`

**Title:** Successful BeaconOps CI/CD Pipeline

**Description:** GitHub Actions run number 9 completed successfully. The screenshot shows the Test and build source, Build scan and publish images, and Deploy to Amazon EKS jobs in green. It also shows commit `6a1f963` and the production deployment endpoint.

**Use for:** M5 CI/CD and M10 live deployment evidence.

---

### [x] `16-eks-worker-nodes-ready.png`

**Title:** Amazon EKS Worker Nodes Ready

**Description:** The EKS cluster contains two Kubernetes worker nodes in the `Ready` state. Both nodes run Kubernetes version `v1.37.0-eks-b9510e3` in the `ap-south-1` region.

**Use for:** M7 EKS worker node group and M8 Kubernetes cluster evidence.

---

### [x] `17-beaconops-kubernetes-resources.png`

**Title:** BeaconOps Kubernetes Workloads and Networking

**Description:** The `beaconops` namespace contains two running backend pods, two running frontend pods, and one running PostgreSQL pod. The screenshot also shows ClusterIP services, the NGINX Ingress hostname, and the backend HorizontalPodAutoscaler configured from 2 to 6 replicas.

**Use for:** M8 pods, replicas, Services, Ingress, and HPA evidence.

---

### [x] `18-monitoring-pods-running.png`

**Title:** Prometheus and Grafana Monitoring Stack

**Description:** The `monitoring` namespace contains running Alertmanager, Grafana, kube-state-metrics, Prometheus Operator, node exporters, and Prometheus pods. This proves that the kube-prometheus-stack installation is running in the EKS cluster.

**Use for:** Supporting M9 Prometheus and Grafana installation evidence.

## Evidence checklist

### M1 - Application

### [x] `01-live-application-eks.png`

**Title:** BeaconOps Application Running on Amazon EKS

**Description:** The production BeaconOps incident dashboard loaded through the AWS Network Load Balancer and Kubernetes Ingress. The browser address bar should show the live AWS hostname and the page should show the usable incident-management interface.

---

### [x] `02-swagger-crud-api.png`

**Title:** FastAPI Incident Management API

**Description:** The FastAPI Swagger page shows the BeaconOps REST endpoints, including GET, POST, PUT, and DELETE operations for incident management.

---

### [x] `03-backend-health.png`

**Title:** FastAPI Health Check

**Description:** A request to the backend `/health` endpoint returns HTTP 200 and a healthy response, proving that the FastAPI service is running.

---

### [x] `04-postgresql-incidents.png`

**Title:** Incident Records Stored in PostgreSQL

**Description:** A `psql` query executed inside the PostgreSQL pod returns incident rows containing ID, title, severity, and status fields. This demonstrates persistent application data managed by PostgreSQL.

## M2 - Testing

### [x] `06-pytest-eight-passed.png`

**Title:** Backend Automated Tests Passing

**Description:** The `pytest -v` output shows all eight backend tests passing. The tests cover health, readiness, metrics, incident listing, creation, updates, deletion, and statistics using an isolated test database.

## M3 - Git and GitHub

### [x] `07-github-commit-history.png`

**Title:** Meaningful Git Commit History

**Description:** The public GitHub repository commit history shows at least ten meaningful commits covering application code, infrastructure, CI/CD fixes, security improvements, and documentation.

---

### [x] `08-gitignore-security.png`

**Title:** Sensitive and Generated Files Excluded from Git

**Description:** The root `.gitignore` excludes environment files, Python caches, Node dependencies, virtual environments, Terraform state, variable files, plans, logs, and private evidence.

## M4 - Docker

### [x] `09-docker-compose-services.png`

**Title:** Three-Service Docker Compose Stack

**Description:** `docker compose ps` shows the frontend, backend, and PostgreSQL containers running successfully after `docker compose up --build`.

---

### [x] `10-docker-compose-browser.png`

**Title:** BeaconOps Running Through Docker Compose

**Description:** The BeaconOps application is loaded in the browser at `http://localhost:3000`, proving that the complete local stack starts through Docker Compose.

## M5 - Container Registry

### [x] `11-ghcr-frontend-sha.png`

**Title:** Frontend Image Published to GHCR

**Description:** The public `beaconops-frontend` GitHub Container Registry package contains an image tagged with the full Git commit SHA rather than `latest`.

---

### [x] `12-ghcr-backend-sha.png`

**Title:** Backend Image Published to GHCR

**Description:** The public `beaconops-backend` GitHub Container Registry package contains an image tagged with the full Git commit SHA rather than `latest`.

## M6 - DevSecOps

### [x] `13-trivy-backend-frontend-scans.png`

**Title:** Trivy Scans Passed for Both Release Images

**Description:** The successful GitHub Actions image job shows completed checkmarks for both `Scan backend image with Trivy` and `Scan frontend image with Trivy`, followed by the SHA-tagged image push. One screenshot covers both required security gates.

## M7 - Terraform and AWS

### [x] `15-terraform-plan.png`

**Title:** Terraform Infrastructure Plan

**Description:** Terraform produces a non-empty infrastructure plan without errors. The plan demonstrates that AWS infrastructure changes are reviewed before they are applied.

---

### [x] `19-aws-vpc-resource-map.png`

**Title:** BeaconOps AWS VPC and Subnets

**Description:** The AWS VPC resource map in `ap-south-1` shows the BeaconOps VPC with two public subnets and two private subnets across two Availability Zones, together with the required routing and NAT resources.

---

### [x] `20-aws-eks-cluster-active.png`

**Title:** BeaconOps Amazon EKS Cluster Active

**Description:** The AWS EKS console shows the `beaconops-production-eks` cluster in the `Active` state in the Mumbai region.

---

### [x] `21-aws-managed-nodegroup-active.png`

**Title:** EKS Managed Node Group Active

**Description:** The EKS Compute page shows the BeaconOps managed node group in the `Active` state with `t3.medium` worker instances and the configured scaling range.

---

### [x] `22-aws-eks-addons-active.png`

**Title:** Required Amazon EKS Add-ons Active

**Description:** The EKS console shows the EBS CSI Driver, EKS Pod Identity Agent, VPC CNI, CoreDNS, and kube-proxy in the `Active` state.

---

### [ ] `26-terraform-destroy-complete.png`

**Title:** Terraform Infrastructure Destroyed Successfully

**Description:** The final Terraform output shows `Destroy complete` after the evaluation and demo. This proves that the AWS resources were removed to prevent unnecessary charges.

**Important:** Capture this last, only after the demo is completely finished.

## M8 - Helm

### [x] `22-helm-release-deployed.png`

**Title:** BeaconOps Helm Release Deployed

**Description:** `helm list -n beaconops` shows the `beaconops` release with a `deployed` status and its chart and application versions.

## M9 - Observability

### [x] `23-prometheus-metrics-output.png`

**Title:** Prometheus Metrics Exposed by FastAPI

**Description:** The backend `/metrics` endpoint returns Prometheus-formatted application metrics such as `http_requests_total` and `http_request_duration_seconds`.

---

### [x] `24-prometheus-target-up.png`

**Title:** Prometheus Scraping BeaconOps Successfully

**Description:** The Prometheus Targets page shows the BeaconOps backend ServiceMonitor target in the `UP` state, proving that application metrics are being collected.

---

### [x] `25-grafana-dashboard.png`

**Title:** BeaconOps Application Health Dashboard

**Description:** The Grafana dashboard contains populated panels for request rate, p95 latency, 5xx errors, ready backend pods, and backend CPU usage.

## Final evidence notes

- The live EKS application screenshot supports both M1 and M8.
- The combined Kubernetes resource screenshot already captured supports pods, replicas, Services, Ingress, and HPA.
- The monitoring-pods screenshot proves installation; the Prometheus `UP` target and populated Grafana dashboard are also captured separately.
- The GitHub Actions summary, both GHCR package pages, and the combined backend/frontend Trivy result are captured.
- Do not take the Terraform destroy screenshot until all live demonstrations and observability screenshots are complete.
