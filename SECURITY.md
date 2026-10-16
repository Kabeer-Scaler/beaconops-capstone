# Security policy

Do not open a public issue containing credentials, access tokens, account IDs, or exploit details. Revoke any exposed credential immediately and remove it from Git history before rotating related secrets.

## Controls in this project

- GitHub OIDC supplies short-lived AWS credentials.
- CI images are immutable SHA tags and are blocked by HIGH/CRITICAL Trivy findings.
- Application containers run as non-root, drop all capabilities, and disallow privilege escalation.
- Sensitive database values are supplied through GitHub Actions and Kubernetes Secrets, never committed.
- Readiness and liveness are separate; database loss removes Pods from service before restart logic intervenes.
- Runtime resources have CPU/memory requests and limits.

The classroom PostgreSQL StatefulSet is intentionally replaceable through `externalDatabase.url` for a managed production database. For a long-lived internet-facing deployment, use Amazon RDS, TLS with a real domain/cert-manager, external secret management, private EKS API access, and restrictive Kubernetes NetworkPolicies.
