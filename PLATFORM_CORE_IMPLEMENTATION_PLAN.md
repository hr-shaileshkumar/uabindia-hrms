# Platform/Core Module - End-to-End Plan

## Scope (Core ERP Prerequisites)
- Tenants (organization containers)
- Companies (legal entities under a tenant)
- Projects/Cost Centers (organizational structure)
- Users, Roles, Policies (RBAC/ABAC)
- Settings (tenant config)
- Feature Flags
- Audit Logs
- Licensing/Modules
- Authentication & Security

## Current State (Observed)
- Single database, tenant isolation via global query filters on TenantId.
- Tenant resolution via subdomain or dev header.
- Modules and tenant modules exist; SettingsController reads TenantConfigs.
- Audit logs captured for POST/PUT/DELETE.
- Several 500s are caused by missing tables/columns (migrations not applied).

## Target Architecture (Per-Tenant Schema)
- One SQL Server database.
- Schema per tenant (e.g., tenant_demo).
- Master schema (dbo) for global tables:
  - Tenants
  - Modules
  - Global feature catalog
- Tenant schema for tenant-scoped tables:
  - Companies, Projects, Users, Roles, UserRoles, TenantConfigs, TenantModules, FeatureFlags, AuditLogs, etc.

### Schema Rules
- Every tenant-scoped entity is stored in the tenant schema.
- Tenant resolution must set current tenant schema in request scope.
- DbContext model cache must include schema name to avoid cross-tenant model reuse.
- All tenant-scoped queries must use the tenant schema as default.

## Core API Endpoints (Platform)
### Tenants
- GET /api/v1/tenants
- POST /api/v1/tenants (create + provision schema + seed defaults)
- PUT /api/v1/tenants/{id}
- POST /api/v1/tenants/{id}/activate
- POST /api/v1/tenants/{id}/deactivate

### Companies
- GET /api/v1/companies?page&limit
- GET /api/v1/companies/{id}
- POST /api/v1/companies
- PUT /api/v1/companies/{id}
- DELETE /api/v1/companies/{id}

### Projects/Cost Centers
- GET /api/v1/projects?companyId
- GET /api/v1/projects/{id}
- POST /api/v1/projects
- PUT /api/v1/projects/{id}
- DELETE /api/v1/projects/{id}

### Users/Roles
- GET /api/v1/users
- POST /api/v1/users
- PUT /api/v1/users/{id}
- DELETE /api/v1/users/{id}
- GET /api/v1/roles
- POST /api/v1/roles
- PUT /api/v1/roles/{id}
- DELETE /api/v1/roles/{id}

### Settings/Feature Flags
- GET /api/v1/settings/tenant-config
- PUT /api/v1/settings/tenant-config
- GET /api/v1/settings/feature-flags
- POST /api/v1/settings/feature-flags

### Modules/Licensing
- GET /api/v1/modules/enabled
- GET /api/v1/modules/catalog
- GET /api/v1/modules/subscriptions
- POST /api/v1/modules/subscriptions

### Audit Logs
- GET /api/v1/audit-logs?page&limit

## Backend Work Plan
### Phase 0: Baseline DB Health
- Apply EF Core migrations for existing schema.
- Verify TenantConfigs, LeaveTypes, LeavePolicies, LeaveRequests tables exist.

### Phase 1: Tenant Schema Support
- Extend ITenantAccessor to include Schema.
- Add tenant schema resolver (from subdomain).
- Update DbContext to set default schema per request.
- Add IModelCacheKeyFactory to include schema in model cache.
- Explicitly map master tables to dbo schema.

### Phase 2: Tenant Provisioning
- Add tenant creation API.
- On tenant create:
  - Create schema (CREATE SCHEMA tenant_x)
  - Seed admin role/user in that schema
  - Seed module subscriptions and default settings

### Phase 3: Licensing Enforcement
- Enforce Module:xyz policy based on TenantModules.
- Add subscription upsert endpoint.

### Phase 4: Audit Log Hardening
- Log entityId when response includes id or specific payload field.
- Add user agent and request path fields.

## Frontend Work Plan
- Tenant list and create flow (admin only).
- Company Master UI with create/update.
- Project/Cost Center UI.
- User/Role admin UI.
- Settings UI (tenant config JSON + feature flags).
- Audit log viewer with filters.
- Licensing page (module catalog + subscriptions).

## Database Migration Strategy
- CLI migration only (no auto-migrate on startup).
- Commands:
  - dotnet ef migrations add <name> --project Backend/src/UabIndia.Infrastructure --startup-project Backend/src/UabIndia.Api
  - dotnet ef database update --project Backend/src/UabIndia.Infrastructure --startup-project Backend/src/UabIndia.Api
- For per-tenant schema:
  - Set tenant schema and run migration per tenant schema.
  - Maintain a master migration for dbo schema.

## Build + Integration
- Backend: dotnet build + dotnet run (API)
- Frontend: npm install + npm run dev
- Health checks: /health/ready
- Smoke tests:
  - auth/me
  - modules/enabled
  - settings/tenant-config
  - companies list

## Risks / Dependencies
- Per-tenant schema migration requires model cache key changes.
- Existing data in dbo needs migration to tenant schemas.
- Module enforcement must not block login and public endpoints.

## Next Actions Needed
- Confirm schema naming convention (tenant_demo or t_demo).
- Decide if we migrate existing data from dbo to tenant schema.
- Approve adding tenant creation endpoint and provisioning service.
