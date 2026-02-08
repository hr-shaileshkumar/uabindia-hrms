# Production Preparation Checklist (Freeze Phase)

Status: **Freeze development** (no new features/UI). Only stabilization, security review, and deployment readiness.

## 1) DTO/PII Masking Audit (Complete Before Launch)
- [ ] Users DTOs expose only: `Id`, `Email`, `FullName`, `IsActive`, `Roles`.
- [ ] No password hash, refresh token, or auth metadata in any response.
- [ ] Payroll DTOs expose only: `RunDate`, `Status`, `Gross`, `Net`, `Details` (confirm `Details` contains no sensitive info).
- [ ] Attendance DTOs expose only: `EmployeeId`, `PunchType`, `Timestamp`, `ProjectId` (no location/IP unless required).
- [ ] Leave DTOs expose only: `EmployeeId`, `LeavePolicyId`, `FromDate`, `ToDate`, `Days`, `Status`, `Reason`.
- [ ] Verify any `AdminOnly` endpoints return minimum necessary fields.
- [ ] Confirm logs do not emit sensitive data outside Development.

## 2) Secrets/Environment Document (For Management Sign‑Off)
- [ ] JWT signing key + rotation policy
- [ ] Access token TTL (minutes)
- [ ] Refresh token TTL (days) + rotation policy
- [ ] DB connection details (server, database, user)
- [ ] CORS allowed origins (web + mobile)
- [ ] Rate‑limit values (permit/window)
- [ ] Logging level + retention targets
- [ ] Storage/log shipping config (if any)
- [ ] Backups schedule + retention

## 3) Infrastructure Decision (Pick One)
### Option A: VPS + Managed SQL
- [ ] VPS provider/region, sizing, OS hardening
- [ ] Managed SQL Server (backups/replication)
- [ ] Private network between VPS and DB (or IP allowlist)

### Option B: Managed App Service + Managed SQL
- [ ] App service plan sizing
- [ ] Managed SQL Server
- [ ] VNET integration / private endpoints

## 4) Public Readiness Gate
- [ ] `api.uabindia.in` DNS + TLS certificate
- [ ] CI still build/test only (no DB migrations until infra ready)
- [ ] Re‑enable migration workflows only after infra is public and secrets are set
- [ ] Staging smoke tests with tenant headers and module policy validation
- [ ] Formal sign‑off: HRMS production‑stable

## 5) Post‑Stability Roadmap
- [ ] CRM and Inventory planning only after HRMS sign‑off
- [ ] Use existing module catalog + tenant subscription model (no architecture changes)
