# Scheduler infrastructure

The application is designed to run from the same Docker image on DigitalOcean,
AWS, Azure, or a self-hosted Docker host.

The first target is DigitalOcean App Platform with managed PostgreSQL. Terraform
owns the application, database, domain, and database firewall. Application
migrations remain an explicit deployment step and are not hidden inside
Terraform.

## Deployment contract

The application expects:

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_NAME`
- future OIDC, object-storage, and email settings

Do not put production secrets in Git or `terraform.tfvars`. Supply them through
the CI secret store or an encrypted deployment variable.
