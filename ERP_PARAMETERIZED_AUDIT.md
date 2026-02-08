# ERP Parameterized Audit (2026-02-05)

## 1) Scope & Parameters
- **Modules in scope**: HRMS, Payroll, Reports, Platform, Licensing, Security, ERP (Customers/Vendors/Items/Chart of Accounts), Compliance, Recruitment, Training, Assets, Overtime, Shifts, Performance Appraisals.
- **Contract definition**: Controller routes + DTOs + service interfaces + frontend routes + API client usage.
- **Audit criteria**: module registration consistency, API-to-UI mapping, submodule completeness, data-flow validation, security alignment, dependency health, build/smoke test.

## 2) Module Registration Consistency
### Backend seeded modules (authoritative list)
Source: [Backend/src/UabIndia.Api/Program.cs](Backend/src/UabIndia.Api/Program.cs#L603-L760)
- hrms
- payroll
- reports
- platform
- licensing
- security

### Backend controllers present (module surface)
Source: [Backend/src/UabIndia.Api/Controllers](Backend/src/UabIndia.Api/Controllers)
- HRMS: Employees, Attendance, Leave
- HRMS submodules: Assets, Recruitment, Training, Overtime, Shifts, Appraisals
- ERP: Customers, Vendors, Items, ChartOfAccounts
- Platform/Security: Auth, Users, Roles, Tenants, Companies, Projects, Modules, Settings, Security, AuditLogs, System, Integrations, Privacy
- Workflow & Approvals: Workflows, Approvals
- Reports, Payroll, Compliance

### Frontend module/menu registration (Next.js)
Source: [frontend-next/src/app/(protected)/layout.tsx](frontend-next/src/app/(protected)/layout.tsx#L40-L167)
- hrms (dashboard, employees, attendance, leave, assets, recruitment, training, overtime, shifts, performance)
- payroll (dashboard, structures, components, runs, payslips, statutory)
- reports (dashboard, hr, payroll, compliance)
- platform (companies, tenants, projects, users, roles, settings, feature-flags, audit-logs)
- licensing (catalog, subscriptions, integrations)
- security (sessions, devices, password policies, mfa)

### Findings
- **HRMS submodules are now registered in the frontend menu**.
- **ERP menu is not registered** despite ERP pages existing under `/app/erp/*`.

**Action required:** add missing submodule menu entries **or** temporarily disable those modules to avoid runtime “module missing” states.

## 3) API-to-UI Mapping Consistency
### Frontend API base
Source: [frontend-next/src/lib/apiClient.ts](frontend-next/src/lib/apiClient.ts#L8-L20)
- Base URL: `/api/v1`

### Route prefix mismatches (critical)
Backend now accepts **both** `/api/v1/*` and legacy `/api/*` for Assets, Training, Compliance, Overtime, and Shifts to preserve backward compatibility.

**Action required:** standardize all frontend calls on `/api/v1/*` and remove legacy usage once clients are updated.

### Frontend API client coverage
Source: [frontend-next/src/lib/hrApi.ts](frontend-next/src/lib/hrApi.ts#L1-L345)
- Includes auth, modules, platform, licensing, security, workflows, approvals, HRMS, payroll, reports, and ERP (customers, vendors, items, chart-of-accounts).
- **ERP purchase-orders and sales-orders are stubbed** (no backend endpoints).

**Action required:** either implement backend endpoints or mark these UI pages as “Coming Soon” and disable service calls.

### Frontend hook-to-backend path mismatches (must fix)
Source: [frontend-next/src/lib/api-hooks-part1.ts](frontend-next/src/lib/api-hooks-part1.ts#L1-L420) and [frontend-next/src/lib/api-hooks-part2.ts](frontend-next/src/lib/api-hooks-part2.ts#L1-L420)
- Hooks now target `/api/v1/*` and align with the current controller routes.
- Overtime flow explicitly uses approvals/logs rather than request submit/approve endpoints.

**Action required:** none pending for hook routing; only optional overtime flow refinement.

### Canonical decisions (ERP freeze)
- **Recruitment applications:** candidates are the canonical “application” entity for this release. Separate application endpoints are out of scope.
- **Training certificates:** minimal endpoints are implemented to lock the contract (`GET /training/certificates/employee/{employeeId}`, `GET /training/certificates/{id}`, `POST /training/certificates`).
- **Legacy `/api/*` routes:** supported temporarily for backward compatibility and marked for deprecation.

## 4) Submodule Completeness Matrix (Snapshot)
| Module | Submodule | Backend Controller | Frontend Page | API Client | Status |
|---|---|---|---|---|---|
| HRMS | Employees | EmployeesController | /app/modules/hrms/employees | hrApi.hrms.employees | ✅ |
| HRMS | Attendance | AttendanceController | /app/modules/hrms/attendance | hrApi.hrms.attendance | ✅ |
| HRMS | Leave | LeaveController | /app/modules/hrms/leave | hrApi.hrms.leave | ✅ |
| HRMS | Assets | AssetsController | /app/modules/hrms/assets | api-hooks-part2 | ✅ |
| HRMS | Recruitment | RecruitmentController | /app/modules/hrms/recruitment | api-hooks-part1 | ✅ |
| HRMS | Training | TrainingController | /app/modules/hrms/training | api-hooks-part1 | ✅ |
| HRMS | Overtime | OvertimeController | /app/modules/hrms/overtime | api-hooks-part2 | ✅ |
| HRMS | Shifts | ShiftsController | /app/modules/hrms/shifts | api-hooks-part2 | ✅ |
| HRMS | Performance | AppraisalsController | /app/modules/hrms/performance | api-hooks-part1 | ✅ |
| Payroll | Structures | PayrollController | /app/modules/payroll/structures | hrApi.payroll.structures | ✅ |
| Payroll | Components | PayrollController | /app/modules/payroll/components | hrApi.payroll.components | ✅ |
| Payroll | Runs | PayrollController | /app/modules/payroll/runs | hrApi.payroll.runs | ✅ |
| Payroll | Payslips | PayrollController | /app/modules/payroll/payslips | hrApi.payroll.payslips | ✅ |
| Payroll | Statutory | PayrollController | /app/modules/payroll/statutory | hrApi.payroll.statutory | ✅ |
| Reports | HR/Payroll/Compliance | ReportsController | /app/modules/reports/* | hrApi.reports.* | ✅ |
| Compliance | Operations | ComplianceController | none | none | ❌ (no UI or API client) |
| ERP | Customers | CustomersController | /app/erp/customers | hrApi.erp.customers | ✅ (menu missing) |
| ERP | Vendors | VendorsController | /app/erp/vendors | hrApi.erp.vendors | ✅ (menu missing) |
| ERP | Items | ItemsController | /app/erp/items | hrApi.erp.items | ✅ (menu missing) |
| ERP | Chart of Accounts | ChartOfAccountsController | /app/erp/chart-of-accounts | hrApi.erp.chartOfAccounts | ✅ (menu missing) |
| ERP | Purchase Orders | none | /app/erp/purchase-orders | stubbed | ⚠️ backend missing |
| ERP | Sales Orders | none | /app/erp/sales-orders | stubbed | ⚠️ backend missing |
| Workflow | Workflows | WorkflowsController | none | hrApi.workflows | ⚠️ UI missing |
| Approvals | Approvals | ApprovalsController | none | hrApi.approvals | ⚠️ UI missing |

## 5) Data-Flow Validation (Sample)
- **Compliance**: UI (missing) → API client (missing) → controller (ComplianceController) → repository (ComplianceRepository) → database. Repository now defaults to zero on missing records for `GetTotalTDSDeductedAsync` and `GetTotal80CDeductionAsync`.
- **HRMS Leave**: UI page exists, API client exists, controller exists, DTOs and repository exist. Route prefix mismatch must be resolved to avoid runtime 404s.

**Action required:** validate DTO shapes during smoke tests.

## 6) Security Alignment Check
- Frontend uses HttpOnly cookie + CSRF token for state-changing requests (see [frontend-next/src/lib/apiClient.ts](frontend-next/src/lib/apiClient.ts#L22-L61)).
- Backend must enforce auth + RBAC + tenant isolation on all controllers (verify `[Authorize]` and tenant filtering across controllers).

**Action required:** verify authorization attributes for controllers with sensitive data (e.g., Compliance, Payroll, ERP, Platform, Security).

## 7) Dependency & Platform Health
- **Sentry.AspNetCore** pinned to 5.0.0.
- **HtmlSanitizer** pinned to 9.1.893-beta (vulnerability scan clean).

**Action required:** migrate to the next stable HtmlSanitizer release once published.

## 8) Build & Smoke Test Status
- Build: `dotnet build` succeeds (no errors).
- Smoke tests: **not automated**; per-module manual smoke tests pending.

**Action required:** define minimal smoke test checklist per module (list/create/update/view/approve/audit).

---

## Immediate Remediation Checklist
1) Register ERP menu entry or explicitly disable ERP pages until fully wired.
2) Add placeholder UI for approvals/workflows/compliance or disable them until fully implemented.
3) Implement backend endpoints or disable ERP purchase-orders/sales-orders pages.
4) Decide whether to add explicit submit/approve endpoints for overtime requests or keep approval-based flow only.
5) Execute module smoke tests and log results.
6) Publish a deprecation note for legacy `/api/*` routes with a removal date (see ERP_FREEZE_NOTES.md).
