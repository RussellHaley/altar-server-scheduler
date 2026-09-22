# SJHN Scheduler application

This is the portable application layer for the altar-server scheduler. It is
deliberately independent of AWS, Azure, DigitalOcean, and Weebly.

## Local development

Requirements: Docker Desktop.

PowerShell:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

POSIX shells:

```bash
cp .env.example .env
docker compose up --build
```

The application container uses a Linux Node.js image. The host operating
system is not part of the application contract; Docker, PostgreSQL, and the
Terraform CLI are the portability boundaries.

Docker's PostgreSQL is available only to the host at `127.0.0.1:5433`; the
application itself always connects over Docker's internal `db:5432` network.
This avoids conflicting with a separately installed PostgreSQL service on port
5432.

The application is then available at `http://localhost:3000` and its health
endpoint is `http://localhost:3000/api/health`.

For local development, Compose enables a development-only sign-in form using
`russ.haley@gmail.com`. This path is disabled when `APP_ENV=production`. Production
deployments should provide `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`,
and `ADMIN_EMAILS` through their secret configuration.

Authentication is handled by Auth.js with Google OAuth. Google stores and
verifies passwords; this application does not store local password hashes. The
application stores Auth.js identity rows plus a parish `UserAccount` record for
domain permissions and contact details. Account contact details currently include
email, primary phone, and secondary phone; street addresses are intentionally not
stored.

Access is invitation-gated. A Google sign-in alone is not enough to create
parish access. A person can use the scheduler only when their email already has
a `UserAccount`, their email is listed in `ADMIN_EMAILS` as a bootstrap
administrator, or an administrator creates an enrollment invitation for that
email. Until an outbound email provider is configured, administrators create a
manual enrollment link from `/admin/accounts` and send it themselves. The raw
invitation token is shown once; only its SHA-256 hash is stored in the database.

The first schema is intentionally small but establishes the core relational
objects: accounts, server profiles, roles, qualifications, rotas, services,
position slots, and assignments. Authentication, availability, volunteer
requests, audit events, and the scheduling engine are the next implementation
layers.

Production deployments run `prisma migrate deploy` from the Linux container
entrypoint before starting the web service. The container must remain stateless.

After the first local startup, load the starter roles and service templates with:

```bash
docker compose exec app npm run db:seed
```

## Importing a liturgical calendar

The scheduler imports the canonical JSON schedule produced by Calendarium
Anglicum. It does not import the CSV or PDF. Each imported service keeps its
stable calendar source ID, local `America/Vancouver` time, liturgical title and
colour, Mass form, cotta style, and the calendar rule/override audit trail.

After starting the application and loading templates, validate an import first.
The container accepts the JSON through standard input, so the generated file
does not need to be copied into the image:

```bash
docker compose exec app npm run db:seed
docker compose exec -T app npm run calendar:import -- - --dry-run \
  < /path/to/schedule-sjhn-2026-2027.json
```

Then perform the import:

```bash
docker compose exec -T app npm run calendar:import -- - \
  < /path/to/schedule-sjhn-2026-2027.json
```

For this workspace, the current source file is:

```text
/home/osboxes/git/calendarium-anglicum/output/schedules/sjhn-2026-2027/schedule-sjhn-2026-2027.json
```

The importer creates a `GENERATED` rota and clones each Mass form's service
template requirements into open altar-server slots. It can safely replace an
earlier imported rota only while it is `DRAFT` or `GENERATED` and none of its
imported services have assignments. This prevents a corrected calendar import
from silently deleting work already assigned to servers. A rota under review or
published must be handled deliberately rather than re-imported in place.

The required template keys are `daily-mass`, `low-mass`, `sung-mass`,
`solemn-mass`, and `solemn-high-mass`. `npm run db:seed` supplies all five,
including the newly added Low Mass template.

The repository includes a GitHub Actions validation workflow. It runs on Ubuntu
to keep the canonical CI environment aligned with the production container.
