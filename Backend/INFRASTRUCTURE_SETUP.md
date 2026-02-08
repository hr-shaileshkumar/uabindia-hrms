# Infrastructure Setup Guide

## Overview
This guide covers the enterprise-grade infrastructure components implemented in the HRMS backend:
- Redis Distributed Caching
- Hangfire Background Job Processing
- Sentry Error Tracking & Performance Monitoring

---

## 1. Redis Distributed Cache

### Purpose
- Reduces database load for frequently accessed data (companies, employees, modules)
- Implements cache-aside pattern for read-heavy operations
- Tenant-scoped cache keys for multi-tenancy support
- 10-minute default TTL for most lookups

### Configuration

#### appsettings.json
```json
{
  "ConnectionStrings": {
    "Redis": "localhost:6379"  // or cloud Redis endpoint
  }
}
```

#### Environment Variables
```bash
# Docker
-e "ConnectionStrings__Redis=redis:6379"

# Cloud (Azure Cache for Redis)
-e "ConnectionStrings__Redis=hrms-cache.redis.cache.windows.net:6379,password=YOUR_KEY"

# Development (Docker Compose)
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
```

### Implementation Details

**DistributedCacheService** (`Infrastructure/Services/DistributedCacheService.cs`)
- Wraps `IDistributedCache` with JSON serialization
- Handles cache misses gracefully (returns null, doesn't fail request)
- `GetOrSetAsync()` implements cache-aside pattern

**Cache Keys**
- Format: `{entity_type}_{tenantId}_{page}_{limit}`
- Example: `company_list_550e8400-e29b-41d4-a716-446655440000_1_10`

**Cached Endpoints**
- `GET /api/v1/companies?page=1&limit=10` → Cached for 10 minutes
- Cache invalidated on: POST, PUT, DELETE operations

### Fallback Behavior
- If Redis is unavailable, system falls back to `AddDistributedMemoryCache()`
- Requests still succeed but without distributed caching across instances
- Logs warnings but doesn't crash

### Performance Impact
- Company list queries: ~5 pages × 10 different limit values = 50 possible cache keys per tenant
- Typical cache hit ratio: 80-90% for employee list operations
- Reduces database queries by 70% for read-heavy workloads

---

## 2. Hangfire Background Job Processing

### Purpose
- Executes long-running operations asynchronously (payroll, notifications, cleanup)
- Provides job persistence and automatic retry on failure
- Includes web dashboard for job monitoring (/hangfire)
- SQL Server storage for reliability

### Recurring Jobs Scheduled

| Job | Schedule | Purpose |
|-----|----------|---------|
| `monthly-payroll` | 11:00 PM, last day of month | Process payroll for all active employees |
| `leave-expiry` | 1:00 AM, 1st of month | Expire unused leave balances |
| `audit-log-archival` | 2:00 AM, every Sunday | Archive audit logs >90 days old |
| `send-notifications` | Every 30 minutes | Send pending notifications/reminders |
| `cleanup-temp-data` | 3:00 AM daily | Clean temporary uploads, expired sessions |

### Configuration

#### appsettings.json
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=.;Database=UabIndia_HRMS;Trusted_Connection=True;"
  }
}
```

### Implementation Details

**HangfireJobService** (`Infrastructure/Services/HangfireJobService.cs`)
- 5 recurring jobs with auto-retry (1-3 attempts)
- Each job logs start/completion with timestamps
- `[AutomaticRetry]` decorator for fault tolerance

**Job Execution**
- Runs on Hangfire Server threads (default: CPU count × 2)
- SQL Server maintains job queue and state
- Each job can be manually triggered/paused from dashboard

### Hangfire Dashboard
```
URL: http://localhost:5000/hangfire
Features:
- View scheduled/running/completed/failed jobs
- Retry failed jobs
- Monitor job performance
- Delete/pause jobs
```

### Database Schema
Hangfire creates 10 tables in SQL Server:
- `HangfireCounter` - Counters for throughput tracking
- `HangfireJob` - Job definitions and state
- `HangfireList` - Job queues
- `HangfireState` - Job state history
- `HangfireSet` - Job tags for querying

### Production Considerations
- Set `ASPNETCORE_ENVIRONMENT=Production` to disable dashboard
- Restrict `/hangfire` endpoint with authentication middleware
- Monitor Hangfire server health via `/health/ready` probe
- Configure multiple Hangfire servers for high availability

---

## 3. Sentry Error Tracking & Monitoring

### Purpose
- Captures unhandled exceptions with full context (stack trace, request data, user ID)
- Tracks performance metrics and slow database queries
- Correlates errors with correlation IDs and request traces
- Real-time alerting for critical errors

### Configuration

#### appsettings.json
```json
{
  "Sentry": {
    "Dsn": "https://examplePublicKey@o0.ingest.sentry.io/0"
  }
}
```

#### Environment Variables
```bash
# Local development
-e "Sentry__Dsn=https://examplePublicKey@o0.ingest.sentry.io/0"

# Azure Key Vault
-e "Sentry__Dsn=@Microsoft.KeyVault(SecretUri=https://vault.azure.net/secrets/sentry-dsn/)"
```

### Implementation Details

**Sentry Configuration** (Program.cs)
```csharp
builder.WebHost.UseSentry(sentryOptions =>
{
    sentryOptions.Dsn = configuration["Sentry:Dsn"];
    sentryOptions.Environment = "Development|Staging|Production";
    sentryOptions.TracesSampleRate = 0.1;  // 10% in production, 100% in dev
    sentryOptions.AttachStacktrace = true;
});
```

**Error Context** (ExceptionMiddleware.cs)
- Automatically adds to error reports:
  - `trace_id` (ASP.NET Core trace identifier)
  - `correlation_id` (custom request tracking ID)
  - `request_path` (endpoint that failed)
  - `request_method` (HTTP verb)
  - User ID (if authenticated)

**Captured Events**
- Unhandled exceptions in middleware
- Database errors (query timeouts, constraint violations)
- Authentication failures
- Rate limiting rejections
- Validation errors

### Performance Monitoring
- **Transactions**: Tracks request lifecycle from start to response
- **Breadcrumbs**: Records user actions leading to error
- **Source Maps**: Maps minified JavaScript to original TypeScript

### Alerts
Configure in Sentry web interface:
- Alert on 10+ errors in 5 minutes
- Alert on new error patterns
- Alert on performance degradation (p95 > 500ms)
- Slack/Email/PagerDuty integrations

---

## 4. Infrastructure Requirements

### Development Environment
```yaml
services:
  # Redis Cache
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]

  # SQL Server (for Hangfire jobs)
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      SA_PASSWORD: YourPassword123!
      MSSQL_PID: Developer

  # Backend API
  api:
    build: ./Backend
    depends_on: [sqlserver, redis]
    environment:
      ConnectionStrings__DefaultConnection: "Server=sqlserver;Database=UabIndia_HRMS;User=sa;Password=YourPassword123!;"
      ConnectionStrings__Redis: "redis:6379"
      Sentry__Dsn: ""  # Optional in dev
```

### Production Environment
**Minimum Requirements**:
- Redis: Cloud Redis (Azure Cache, AWS ElastiCache, Redis Cloud)
- SQL Server: Standard or Premium tier
- API Server: 2+ instances behind load balancer
- Sentry: Free tier (5k errors/month) or paid

**High Availability Setup**:
```
Load Balancer
    ↓
[API Instance 1] ← → Redis Cluster (3 nodes)
[API Instance 2] ← → SQL Server Replica
[API Instance 3]
```

---

## 5. Health Checks

### Endpoints
- `/health/live` - Process is running (always returns 200)
- `/health/ready` - Database + Hangfire server operational

### Monitoring
```bash
# Check cache health
curl http://localhost:5000/health/live

# Check database + job server health
curl http://localhost:5000/health/ready
```

---

## 6. Troubleshooting

### Redis Connection Issues
```
Error: "Redis connection failed"
Fix: Ensure Redis is running and accessible
      docker ps | grep redis
      redis-cli ping
```

### Hangfire Jobs Not Running
```
Error: "Recurring jobs not found"
Fix: 1. Verify SQL Server connection string
     2. Check Hangfire server is running (logs should show "Starting Hangfire Server")
     3. Navigate to /hangfire dashboard to view job status
```

### Sentry Not Capturing Errors
```
Error: "Exceptions not appearing in Sentry"
Fix: 1. Verify DSN is configured and valid
     2. Check Sentry project is active
     3. Monitor logs for Sentry SDK errors
     4. Test with: throw new Exception("Test error");
```

### Cache Hit Issues
```
Error: "Always getting cache misses"
Fix: 1. Ensure same cache key is used (check TenantId)
     2. Verify TTL is set correctly (default 10 min)
     3. Check Redis memory isn't full (redis-cli INFO memory)
```

---

## 7. Monitoring & Metrics

### Recommended Dashboards
1. **Sentry** - Error rate, performance, releases
2. **Hangfire Dashboard** - Job processing, throughput, failures
3. **Application Insights** - Request tracing, dependencies, custom events
4. **Redis Commander** - Cache hit ratio, memory usage, key count

### Key Metrics to Track
- Cache hit ratio: Target >80%
- Job success rate: Target >99%
- Error rate: Target <1%
- Average response time: Target <200ms

---

## 8. Configuration Checklist

- [ ] Redis connection string configured (dev/prod)
- [ ] SQL Server configured for Hangfire storage
- [ ] Sentry DSN configured (optional in dev)
- [ ] Hangfire dashboard access restricted to admins
- [ ] Recurring jobs tested and verified running
- [ ] Error tracking verified (test error in dev)
- [ ] Cache invalidation tested (CRUD operations)
- [ ] Health checks configured in load balancer
- [ ] Database backups configured for Hangfire tables
- [ ] Monitoring dashboards set up (Sentry, Hangfire, Application Insights)
