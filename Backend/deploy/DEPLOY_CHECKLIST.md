# Deployment Checklist — UabIndia API

This checklist documents the safe steps to deploy the API to a VPS and run migrations.

Prerequisites
- Ensure you have a current DB backup before applying migrations.
- GitHub Actions secrets set for production/staging (see list below).
- `/etc/uabindia_api.env` on server contains production environment variables (owner root, mode 600).

Steps

1. Build and publish artifact

```bash
dotnet publish Backend/src/UabIndia.Api/UabIndia.Api.csproj -c Release -o ./publish
```

2. (Optional) Run migrations against a staging DB for validation

Use the `deploy-migrations.yml` workflow or run locally with docker/sqlcmd (set env vars).

3. Upload artifact to VPS (example using `scripts/deploy_to_vps.sh`)

```bash
VPS_USER=me VPS_HOST=prod.example.com VPS_PATH=/var/www/uabindia ./scripts/deploy_to_vps.sh
```

or from Windows PowerShell:

```powershell
# $env:VPS_USER='me'; $env:VPS_HOST='prod.example.com'; $env:VPS_PATH='/var/www/uabindia'
# .\scripts\deploy_to_vps.ps1
```

4. Verify service and logs

```bash
# on server
sudo systemctl status uabindia-api
sudo journalctl -u uabindia-api -f --no-hostname
curl -I https://api.example.com/health
```

5. Rollback plan
- If migration fails, restore DB from backup.
- Keep previous artifact on server (e.g., `/var/www/uabindia/releases/prev`) to quickly rollback by replacing files and restarting service.

Security notes
- Never commit secrets to the repository or push `.env` files containing passwords.
- Store SSH keys and DB passwords in GitHub Actions secrets.
- Limit access to the VPS and rotation of credentials regularly.

Required GitHub Secrets (add these in repository Settings → Secrets and variables → Actions)

- `STAGING_SSH_PRIVATE_KEY`: SSH private key used by the `staging-deploy.yml` workflow for staging server access.
- `STAGING_VPS_USER`: SSH user for the staging server (used by deploy scripts).
- `STAGING_VPS_HOST`: Hostname or IP of the staging server.
- `STAGING_VPS_PATH`: Destination path on the staging server (e.g., `/var/www/uabindia`).
- `STAGING_DB_SERVER`: Staging database server host (used by `deploy-migrations.yml`).
- `STAGING_DB_USER`: Staging DB username.
- `STAGING_DB_PASSWORD`: Staging DB password.
- `STAGING_DB_NAME`: Staging DB name.

- `SSH_PRIVATE_KEY`: SSH private key used by production deploy workflow (`ci-deploy.yml`).
- `VPS_USER`: SSH user for production server.
- `VPS_HOST`: Production host/IP.
- `VPS_PATH`: Production deployment path on the server.
- `PRODUCTION_DB_SERVER`: Production DB server host (used by `deploy-migrations-prod.yml`).
- `PRODUCTION_DB_USER`: Production DB username.
- `PRODUCTION_DB_PASSWORD`: Production DB password.
- `PRODUCTION_DB_NAME`: Production DB name.

- `GH_TOKEN` (optional): a personal access token for non-interactive `gh` usage in local helpers (not required for GitHub Actions which get `GITHUB_TOKEN` automatically).

Notes:
- Use repository-level Actions secrets (do not expose secrets in workflow files).
- For sensitive operations (production migrations), consider gating the workflow with a `manual` approval or use environment protection rules in GitHub.

Troubleshooting
- If service fails to start, check `journalctl -u uabindia-api` and `sudo systemctl status uabindia-api` for errors.
- Ensure `/etc/uabindia_api.env` is valid and the app user has read access if running under a dedicated service user.
