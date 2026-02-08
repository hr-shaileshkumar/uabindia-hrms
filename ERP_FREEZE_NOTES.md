# ERP Freeze Notes (2026-02-05)

## Canonical API Contract
- **Primary contract:** `/api/v1/*`
- **Legacy compatibility:** `/api/*` is **deprecated** and retained only for short-term backward compatibility.
- **Target removal date:** 2026-06-30 (or earlier once all known clients are migrated).
- **410 schedule:** non-production starts 2026-05-31; production starts 2026-06-30.

## Functional Decisions
### Training Certificates
- **In scope** for this release.
- Endpoints are implemented and considered part of the frozen contract:
  - `GET /api/v1/training/certificates/employee/{employeeId}`
  - `GET /api/v1/training/certificates/{id}`
  - `POST /api/v1/training/certificates`

### Recruitment Applications
- **Canonical model:** candidates are the application layer for this release.
- No separate “applications” endpoints are supported.
- UI and API clients must treat candidate records as applications.

## Governance Rule (Freeze Enforcement)
Any new ERP feature must include, in the same change set:
1) Backend controller + DTOs + repository/service coverage
2) Frontend wiring (page + API client/hooks)
3) Security enforcement (auth + RBAC + tenant isolation)
4) Smoke tests (list/create/update/view + error handling)

## Notes
- If the legacy `/api/*` routes are accessed after the removal date, requests will return `410 Gone`.
- Changes to the API contract require a version bump and documented migration steps.
- **Freeze-stable baseline tag:** `erp-freeze-stable-2026-02-05`
