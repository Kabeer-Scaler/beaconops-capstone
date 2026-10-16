# Evaluation evidence checklist

Store screenshots outside Git history if they contain account identifiers. Use readable filenames and capture the full command plus result.

## M1 — Application

- Live browser dashboard reached through the AWS load balancer
- Create an incident, advance its status, and delete it
- `/docs` showing incident CRUD operations
- PostgreSQL proof: `kubectl exec -n beaconops beaconops-beaconops-postgresql-0 -- psql -U beaconops -d beaconops -c 'select id,title,severity,status from incidents;'`

## M2 — Testing

- `pytest -v` showing all 8 tests passed
- Explain that `backend/tests/conftest.py` overrides `DATABASE_URL` with an isolated SQLite test file that is recreated per test

## M3 — Git and GitHub

- Public repository URL
- Commit graph showing at least ten meaningful commits
- Show `.gitignore` exclusions for secrets, Python, Node, and Terraform state

## M4 — Docker

- Successful backend and frontend build logs
- `docker compose ps` showing frontend, backend, and PostgreSQL healthy
- Browser on port 3000 for evaluator reproduction
- Point to numeric non-root users in both Dockerfiles

## M5/M6 — CI/CD and security

- Green GitHub Actions run URL
- Test, frontend build, two image build, two Trivy scan, GHCR push, and deploy jobs
- GHCR pages showing the full commit SHA tags
- Trivy table output and the explanation in the root README

## M7 — Terraform

- Non-empty `terraform plan`
- AWS VPC view showing at least two public and two private subnets
- Active EKS cluster and managed node group
- Successful `terraform destroy` after evaluation

## M8 — Kubernetes and Helm

- `kubectl get pods -n beaconops` with 2 backend, 2 frontend, and PostgreSQL Running/Ready
- `kubectl get svc,ingress,hpa -n beaconops`
- `helm list -n beaconops`
- Live application via Ingress load-balancer hostname

## M9 — Observability

- Prometheus-formatted `/metrics` output
- Prometheus Targets page with BeaconOps `UP`
- Populated **BeaconOps Application Health** Grafana dashboard

## M10 — Final presentation

- Commit a small visible change with a meaningful message
- Watch test → build → scan → publish → deploy
- Refresh the live EKS application and identify the deployed SHA
- Perform one troubleshooting exercise and explain the diagnosis
