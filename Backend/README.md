UabIndia HRMS — Backend

This folder contains the .NET 8 Clean Architecture backend for the UabIndia HRMS/ERP platform.

Structure:
- src/UabIndia.Api: API project (controllers, middleware)
- src/UabIndia.Core: Domain entities and interfaces
- src/UabIndia.Application: Application interfaces
- src/UabIndia.Infrastructure: EF Core DbContext and infrastructure services
- src/UabIndia.Identity: JWT & Refresh token services
- db/schema.sql: SQL Server DDL for HRMS-first, ERP-ready schema

Key capabilities:
- Multi-tenant isolation with tenant-scoped queries
- JWT authentication, refresh tokens, and RBAC
- Core HRMS + ERP controllers and services
- Audit logging and soft delete on core entities

How to run locally

- Start the API (from repo root you can run the helper project):

```powershell
dotnet run
```

This helper launches the API project at `src/UabIndia.Api` and binds it to `http://0.0.0.0:5000` so Android emulators can reach it via `http://10.0.2.2:5000`.

You can also run the API directly:

```powershell
dotnet run --project "Backend/src/UabIndia.Api/UabIndia.Api.csproj" --urls "http://0.0.0.0:5000"
```

Environment variables (important):

- `Jwt__Key` or `JWT_KEY` — JWT signing key (required)
- `Jwt__Issuer` or `JWT_ISSUER` — JWT issuer (required)
- `Jwt__Audience` or `JWT_AUDIENCE` — JWT audience (required)
- `ConnectionStrings__DefaultConnection` — SQL Server connection string (optional; appsettings default provided)

Health and readiness

- A simple health endpoint is available: `GET /health` which returns DB connectivity status.

Docker

- A Dockerfile is included at `Backend/Dockerfile` for containerized runs. The container listens on port 5000.

Next steps:
- Run migrations in your target environment
- Verify module endpoints for your tenant configuration
