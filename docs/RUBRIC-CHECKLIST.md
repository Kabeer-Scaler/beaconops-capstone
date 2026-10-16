# Rubric coverage matrix

| Module | Required criterion | Implementation / evidence |
|---|---|---|
| M1 | FastAPI `/health` | `backend/app/main.py`; liveness probe uses it |
| M1 | 4+ GET/POST/PUT/DELETE APIs | Six incident endpoints plus system endpoints |
| M1 | PostgreSQL + Alembic table | `Incident` model and `0001_create_incidents.py` |
| M1 | React API UI | Full dashboard in `frontend/src/`; `/api` routed by Ingress/Nginx |
| M1 | Responsive usable UI | Desktop/tablet/mobile breakpoints, states, modal, filters |
| M2 | pytest passes | `backend/tests/test_api.py` contains 8 test cases |
| M2 | 3+ endpoints covered | health/ready/metrics/list/get/create/update/delete/stats |
| M2 | Test DB, not production | Autouse SQLite lifecycle fixture in `conftest.py` |
| M2 | pytest configuration | `backend/pytest.ini` and `backend/tests/conftest.py` |
| M3 | Public GitHub + commits | External setup; follow `docs/EVIDENCE.md` |
| M3 | Complete `.gitignore` | Excludes `.env`, caches, dependencies, venv, Terraform state |
| M4 | Backend Dockerfile | Multi-stage, numeric non-root UID 10001, health check |
| M4 | Frontend Dockerfile | Node build → unprivileged Nginx, numeric non-root UID 101 |
| M4 | Three-service Compose | frontend/backend/PostgreSQL with health-based dependencies |
| M5 | Push-to-main workflow | `.github/workflows/ci-cd.yml` |
| M5 | pytest + frontend build | Blocking `test` job |
| M5 | two images + GHCR | `containerize` job; packages write permission |
| M5 | Git SHA tags | Both image tags use `${{ github.sha }}`; no latest tag |
| M6 | Trivy on both images | Separate backend/frontend steps, HIGH/CRITICAL exit code 1 |
| M7 | Valid Terraform | Versioned AWS, VPC, EKS modules and typed variables |
| M7 | 2+ public subnets | Two AZs, two public and two private subnets |
| M7 | EKS + worker group | Managed EKS 1.37, 2–4 worker nodes |
| M7 | tfvars example/no secrets | `terraform.tfvars.example`; state/secrets ignored |
| M8 | Namespace | `k8s/namespace.yaml` with restricted Pod Security labels |
| M8 | Complete Helm chart | Chart, values profiles, Deployments, Services, Ingress, HPA |
| M8 | 2+ replicas | Two backend and two frontend replicas by default and in prod |
| M8 | ClusterIP + correct routes | `/api` → backend; `/` → frontend; named service ports |
| M9 | Prometheus metrics | Instrumented `/metrics`, ServiceMonitor every 15 seconds |
| M9 | Prometheus/Grafana | CI installs kube-prometheus-stack with supplied values |
| M9 | Populated panel | Auto-provisioned dashboard: rate, p95, errors, pods, CPU |
| M10 | Root README | Architecture, run/deploy/teardown, API and security explanation |
| M10 | Live delivery demo | Atomic EKS deploy job plus steps in `docs/EVIDENCE.md` |
