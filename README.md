# BeaconOps — Production Incident Command Center

[![CI/CD](https://github.com/YOUR_GITHUB_USERNAME/beaconops-capstone/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/YOUR_GITHUB_USERNAME/beaconops-capstone/actions/workflows/ci-cd.yml)

BeaconOps is an original SaaS-style incident-management application built for operations teams. Responders declare production incidents, assign an incident commander, prioritize severity, move a response through its lifecycle, search the active queue, and track live operational metrics.

This repository is the complete DevOps capstone: application, automated tests, containerization, security gates, AWS infrastructure as code, Kubernetes packaging, autoscaling, observability, deployment automation, and troubleshooting exercises.

## Live environment

| Surface | URL |
|---|---|
| Application | Set after the first EKS deployment |
| OpenAPI / Swagger | `<application-url>/docs` |
| Health | `<application-url>/health` through a backend port-forward, or `/api` via Ingress |
| Grafana | Exposed for the evaluation window using the command in `docs/DEPLOYMENT.md` |

The CI/CD workflow writes the current Ingress load-balancer URL to the production environment after every successful deployment.

## Architecture

```text
Developer -> GitHub -> GitHub Actions
                         |-- pytest (8 API tests, isolated SQLite database)
                         |-- Vite production build
                         |-- two non-root container builds
                         |-- Trivy HIGH/CRITICAL gates
                         `-- SHA-tagged images -> GHCR
                                                |
Terraform -> AWS VPC (2 AZs, public/private subnets, NAT) -> EKS
                                                              |
                                           ingress-nginx -> React/Nginx (2+ Pods)
                                                          -> FastAPI (2–6 Pods, HPA)
                                                                  |
                                                         PostgreSQL StatefulSet + PVC
                                                                  |
                                            Prometheus <- /metrics -> Grafana dashboard
```

## Application capabilities

- React 19 + Vite responsive incident-command dashboard
- FastAPI REST API with OpenAPI documentation
- PostgreSQL persistence through SQLAlchemy 2 and Alembic
- Create, read, filter, update, and delete incident APIs
- Liveness (`/health`), database readiness (`/ready`), and Prometheus (`/metrics`) endpoints
- Loading, empty, validation, backend-error, and success states
- Severity, status, service, commander, search, and operational statistics

### REST API

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/incidents` | List and filter incidents |
| `GET` | `/api/incidents/{id}` | Retrieve one incident |
| `POST` | `/api/incidents` | Declare an incident |
| `PUT` | `/api/incidents/{id}` | Update response ownership or status |
| `DELETE` | `/api/incidents/{id}` | Remove an incident |
| `GET` | `/api/incidents/stats` | Return dashboard KPIs |
| `GET` | `/health`, `/ready`, `/metrics` | Kubernetes and observability probes |

## Repository map

```text
backend/                 FastAPI, SQLAlchemy, Alembic, and pytest
frontend/                React/Vite app and non-root Nginx runtime
.github/workflows/       test -> build -> Trivy -> GHCR -> EKS pipeline
terraform/               AWS VPC, EKS, workers, and GitHub OIDC role
helm/beaconops/           Deployments, Services, Ingress, HPA, PostgreSQL, monitoring
k8s/                     namespace bootstrap manifest
monitoring/              Prometheus/Grafana stack values
troubleshooting/         intentional ImagePullBackOff and Service selector faults
scripts/                 controlled HPA load generator
docs/                    deployment, operations, rubric, and evidence guides
```

## Quality gates

Tests use a disposable SQLite database rather than production PostgreSQL:

```bash
cd backend
python -m pip install -r requirements.txt
pytest -v
```

The required one-command three-service stack remains available for evaluator reproduction:

```bash
docker compose up --build
```

This local command is not the production target. Production is the EKS environment deployed by `.github/workflows/ci-cd.yml`; see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Delivery guarantees

- Tests and frontend compilation must pass before any image is built.
- Both images are scanned separately; any HIGH or CRITICAL CVE fails the pipeline.
- GHCR tags are the immutable full Git commit SHA—there is no `latest` deployment.
- Helm uses an atomic rolling deployment and waits for readiness.
- Runtime containers are non-root, drop Linux capabilities, block privilege escalation, and use read-only root filesystems where practical.
- Kubernetes uses two frontend and two backend replicas, disruption budgets, resource limits, readiness/liveness probes, and backend HPA.
- No cloud credentials or production passwords are stored in source control.

## Production deployment

The deployment requires a GitHub repository and an AWS account. The concise sequence is:

1. Push this repository to GitHub.
2. Run `terraform init`, `terraform plan`, and `terraform apply` from `terraform/`.
3. Add the Terraform role output and production passwords to GitHub Actions secrets.
4. Enable the deployment repository variable.
5. Push to `main`; CI tests, scans, publishes, and deploys the exact SHA.

All settings and verification commands are documented in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). Cost-safe teardown is documented there and in [`terraform/README.md`](terraform/README.md).

## Security scan explanation

Trivy scans the operating-system packages and application dependencies inside both built images. The CI configuration exits with failure when a HIGH or CRITICAL vulnerability is found, so an affected image is never pushed or deployed; a clean scan means the vulnerability database found no matching unfixed or fixed findings at those severities at scan time, not that the software is guaranteed vulnerability-free.

## Evaluation evidence

Use [`docs/EVIDENCE.md`](docs/EVIDENCE.md) during the final demo. It maps the required screenshots and live commands to all ten grading modules. [`docs/RUBRIC-CHECKLIST.md`](docs/RUBRIC-CHECKLIST.md) maps every point in `GRADING.md` to a concrete file or verification step.

## Cost warning

EKS, EC2 workers, a NAT gateway, EBS volumes, and load balancers incur AWS charges. Run the teardown sequence immediately after evaluation; deleting only Pods does not remove cloud infrastructure.
