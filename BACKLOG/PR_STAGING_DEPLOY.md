PR: Add Staging Deploy workflow and scripts

Summary
-------
This PR adds scripting and a GitHub Actions workflow to perform staging deployments. The goal is to
allow a safe staging deploy via `workflow_dispatch` before any production deploy. Changes included:

- `.github/workflows/staging-deploy.yml` — build, publish, rsync to staging VPS and restart service.
- `scripts/deploy_to_staging.sh` and `scripts/deploy_to_staging.ps1` — local scripts to deploy to staging from a developer machine.
- `Backend/deploy/uabindia_api.env.staging` is referenced (not added) — copy and fill with staging env vars on CI or server.

How to run staging deploy locally
-------------------------------
1. Build and publish the API:

```bash
dotnet publish Backend/src/UabIndia.Api/UabIndia.Api.csproj -c Release -o ./publish
```

2. Run staging deploy script (example):

```bash
# from repo root
STAGING_VPS_USER=me STAGING_VPS_HOST=staging.example.com STAGING_VPS_PATH=/var/www/uabindia-staging ./scripts/deploy_to_staging.sh
```

How to dispatch workflow on GitHub
---------------------------------
1. Add repository secrets: `STAGING_VPS_USER`, `STAGING_VPS_HOST`, `STAGING_VPS_PATH`, and `STAGING_SSH_PRIVATE_KEY`.
2. Go to Actions → Staging Deploy → Run workflow (workflow_dispatch) and confirm environment `staging`.

Notes
-----
- This PR does not include production deploy changes. Production flows remain gated.
- Ensure `/etc/uabindia_api.env` is prepared on the staging server or provide `Backend/deploy/uabindia_api.env.staging` in CI (kept out of repo).
