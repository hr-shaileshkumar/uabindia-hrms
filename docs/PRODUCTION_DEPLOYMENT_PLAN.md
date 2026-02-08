# Production Transition Plan (Managed App Service + Managed SQL)

Status: **No new features/UI.** Deployment + operations only.

## 1) Infra Decision (Confirmed)
- Managed App Service + Managed SQL (public)
- Backups: enabled + retention policy
- Monitoring: platform metrics + logs

## 2) Provision Managed SQL
- Create SQL instance + database
- Enable automated backups + PITR
- Configure firewall rules / private endpoints
- Create least‑privilege DB user for app

## 3) Prepare Production Secrets (outside repo)
- JWT signing key + issuer/audience
- DB connection string
- CORS allowed origins (web + mobile)
- Rate limit values
- Logging levels / storage

## 4) Deploy Backend to api.uabindia.in
- Configure App Service (HTTPS only)
- Set env vars from secrets
- Enable HSTS in Production
- Configure CORS
- Validate health endpoint

## 5) Re‑enable Migration Workflows
- Enable staging/prod workflows
- Run module migrations against public DB
- Verify Modules + TenantModules

## 6) Staging Smoke Tests
- Login → enabled modules
- HRMS APIs: Employees, Attendance, Leave, Payroll, Reports
- Validate auth + tenant isolation + module policies

## 7) Production‑Stable Declaration
- Sign‑off after smoke tests
- Freeze until post‑launch monitoring stable

## 8) Post‑Stability Roadmap
- Plan CRM/Inventory using existing module catalog + tenant subscriptions
- No core architecture changes
