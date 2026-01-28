# Migration scripts

This folder contains idempotent SQL migration artifacts generated from EF Core migrations.

- File: `migrate-20260128.sql` — idempotent script that creates/updates schema for all migrations.

Usage (review first):

- To run locally with `sqlcmd`:

```powershell
sqlcmd -S <server> -U <user> -P <password> -i Backend\migrations_scripts\migrate-20260128.sql
```

- CI: The repository includes a workflow at `.github/workflows/deploy-migrations.yml` that applies the SQL to the `staging` environment. The workflow reads these secrets (set in repository settings):

- `STAGING_DB_SERVER` — host or host,port
- `STAGING_DB_USER`
- `STAGING_DB_PASSWORD`

Production deployment

- There's also a production workflow at `.github/workflows/deploy-migrations-prod.yml` which targets the `production` environment and therefore requires environment approval in GitHub. It uploads a small audit artifact containing the run metadata (actor, run id, sha) before executing the SQL.

Secrets required for production (set in repository secrets):

- `PRODUCTION_DB_SERVER`
- `PRODUCTION_DB_USER`
- `PRODUCTION_DB_PASSWORD`

Notes:
- The CI job targets the `staging` environment and therefore will require review/approval when environment protection rules are configured in GitHub.
- Best practice: review the generated SQL, run against a staging DB, then promote to production via your normal runbook or an approval-gated workflow.
