# HRMS Architecture & Separation of Concerns

## Purpose
This document defines strict separation of concerns for the HRMS monorepo and provides a scalable structure for multi-company, multi-module ERP growth.

## Responsibilities by Layer

### Frontend (Web/Mobile UI)
**Allowed:**
- UI components and layout
- Routing and navigation
- State binding (UI state only)
- API calls to backend
- Display-only formatting (dates, labels)

**Not allowed:**
- Business rules, calculations, or validations
- Permission decisions or access rules
- Master data ownership or transformations
- Sensitive data handling or token logic beyond storage of session identifiers

### Backend (API + Domain)
**Must contain:**
- All business rules, validations, and approvals
- RBAC/ABAC and data access enforcement
- Data shaping, masking, and privacy controls
- Tenant resolution and multi-company data isolation
- Audit trails and operational logging

### Shared Layer
**Use for:**
- DTOs/Contracts
- Shared enums and constants
- Validation schemas (server-side)
- Cross-module domain primitives

## Recommended Folder Structure

```
/Backend
  /src
    /UabIndia.Api              # HTTP endpoints, middleware, authentication
    /UabIndia.Application      # Use-cases, commands/queries, service interfaces
    /UabIndia.Core             # Domain entities, value objects, policies
    /UabIndia.Infrastructure   # EF Core, external services, messaging
    /UabIndia.SharedKernel     # Shared contracts and cross-cutting concerns
  /db
  /migrations_scripts

/Frontend
  /src
    /components               # UI-only components
    /pages                    # Route-level UI
    /services                 # API calls (RTK Query)
    /store                    # State management
    /styles                   # Theme, tokens

/Mobile
  /src
    /screens                  # UI-only screens
    /services                 # API calls
    /store

/docs
  ARCHITECTURE.md
```

## Security & Compliance Standards

- **Auth:** Use secure server-side auth flows. Tokens should be stored in httpOnly cookies (preferred) or a secure session store; avoid sensitive data in localStorage.
- **RBAC:** Enforce all permissions server-side. UI should only reflect the current session and server-provided permissions.
- **Data masking:** Mask PII/PHI in API responses where not required.
- **Tenant isolation:** All data queries must be scoped by tenant ID.
- **Logging:** Never log request/response bodies in production.
- **Secrets:** No hardcoded secrets in repo; use environment variables and secret stores.

## ERP-Ready Module Boundaries (Future Expansion)
- **HR Core:** Employee directory, org structure, roles, attendance
- **Payroll:** Compensation, taxes, payouts
- **Recruitment:** ATS, offers, onboarding
- **Performance:** Reviews, objectives
- **Finance/Assets:** Capex, inventory, assets

Each module must expose a minimal, versioned API and share only contracts via SharedKernel.
