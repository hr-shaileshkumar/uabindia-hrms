# HRMS/ERP System - Deployment & Operations Manual

**Version:** 1.0  
**Date:** February 3, 2026  
**Audience:** DevOps Engineers, System Administrators, Operations Team

---

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Staging Deployment](#staging-deployment)
3. [Production Deployment](#production-deployment)
4. [Monitoring & Alerting](#monitoring--alerting)
5. [Incident Response](#incident-response)
6. [Maintenance Procedures](#maintenance-procedures)
7. [Troubleshooting Guide](#troubleshooting-guide)

---

## Local Development Setup

### Prerequisites

| Component | Version | Installation |
|-----------|---------|---|
| .NET SDK | 8.0+ | https://dotnet.microsoft.com/en-us/download |
| SQL Server | 2022 | Azure SQL Edge (Docker) or local install |
| Node.js | 18+ | https://nodejs.org/ |
| Docker | Latest | https://www.docker.com/products/docker-desktop |
| Git | Latest | https://git-scm.com/ |

### Quick Start (Docker Compose)

```bash
# Clone repository
git clone https://github.com/uabindia/hrms.git
cd hrms

# Start services
docker-compose up -d

# Verify services
docker-compose ps

# View logs
docker-compose logs -f api

# Access application
# API: http://localhost:5000
# Frontend: http://localhost:3000
# Database: localhost:1433 (sa/YourPassword123)
```

### Manual Setup

#### 1. Backend Setup

```bash
cd Backend/src/UabIndia.Api

# Restore dependencies
dotnet restore

# Apply migrations
dotnet ef database update --project ../UabIndia.Infrastructure

# Run application
dotnet run

# API available at: http://localhost:5000
```

#### 2. Frontend Setup

```bash
cd Frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Frontend available at: http://localhost:3000
```

#### 3. Database Setup

```bash
# Using Docker (recommended)
docker run -e 'ACCEPT_EULA=Y' -e 'SA_PASSWORD=YourPassword123' \
  -p 1433:1433 -d mcr.microsoft.com/mssql/server:2022-latest

# Connection string
Server=localhost;Database=HRMS;User Id=sa;Password=YourPassword123;
```

### Environment Variables

**Backend (.env or appsettings.Development.json):**

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=HRMS;User Id=sa;Password=YourPassword123;"
  },
  "Jwt": {
    "Key": "your-super-secret-key-min-32-characters-long-here-2024",
    "Issuer": "https://hrms.uabindia.com",
    "Audience": "hrms-api-clients",
    "ExpiryMinutes": 15
  },
  "ApplicationInsights": {
    "InstrumentationKey": "your-app-insights-key"
  },
  "RateLimiting": {
    "EnableRateLimiting": true,
    "GlobalLimitPerMinute": 1000,
    "TenantLimitPerDay": 10000
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:3000", "http://localhost:5000"]
  }
}
```

**Frontend (.env.local):**

```bash
VITE_API_URL=http://localhost:5000
VITE_API_TIMEOUT=30000
VITE_ENABLE_MOCK_API=false
```

---

## Staging Deployment

### Azure App Service Deployment

#### 1. Create App Service

```bash
# Variables
RESOURCE_GROUP="hrms-staging-rg"
APP_NAME="hrms-staging-api"
REGION="eastus"
APP_PLAN="hrms-staging-plan"

# Create resource group
az group create --name $RESOURCE_GROUP --location $REGION

# Create App Service Plan
az appservice plan create \
  --resource-group $RESOURCE_GROUP \
  --name $APP_PLAN \
  --sku B2 \
  --is-linux

# Create App Service
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_PLAN \
  --name $APP_NAME \
  --runtime "DOTNETCORE|8.0"
```

#### 2. Configure Application Settings

```bash
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings \
    ConnectionStrings__DefaultConnection="@Microsoft.KeyVault(VaultName=hrms-kv;SecretName=db-conn-string)" \
    Jwt__Key="@Microsoft.KeyVault(VaultName=hrms-kv;SecretName=jwt-key)" \
    ASPNETCORE_ENVIRONMENT="Staging"
```

#### 3. Deploy via GitHub Actions

The `ci-cd-pipeline.yml` workflow automatically:
1. Builds backend and frontend
2. Runs all tests (16/16 passing)
3. Builds Docker image
4. Pushes to container registry
5. Deploys to staging
6. Runs smoke tests

**Deploy Command (manual):**

```bash
# Build publish artifacts
cd Backend/src/UabIndia.Api
dotnet publish -c Release -o ./bin/publish

# Deploy to App Service
az webapp deployment source config-zip \
  --resource-group hrms-staging-rg \
  --name hrms-staging-api \
  --src ./bin/publish.zip
```

#### 4. Verify Staging Deployment

```bash
# Check application is running
curl https://hrms-staging-api.azurewebsites.net/health

# Response should be:
# {
#   "status": "Healthy",
#   "checks": {
#     "Database": "Healthy",
#     "ApplicationInsights": "Healthy"
#   }
# }

# Run smoke tests
dotnet test --project tests/UabIndia.Tests/UabIndia.Tests.csproj \
  --filter "Category=Smoke" \
  --configuration Release
```

---

## Production Deployment

### Azure Container Instances (Recommended)

#### 1. Build and Push Docker Image

```bash
# Build Docker image
cd Backend/src/UabIndia.Api
docker build -f Dockerfile.prod -t hrms-api:latest .

# Tag for registry
docker tag hrms-api:latest ghcr.io/uabindia/hrms-api:latest
docker tag hrms-api:latest ghcr.io/uabindia/hrms-api:1.0.0

# Login to GitHub Container Registry
echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u USERNAME --password-stdin

# Push to registry
docker push ghcr.io/uabindia/hrms-api:latest
docker push ghcr.io/uabindia/hrms-api:1.0.0
```

#### 2. Deploy to Azure Container Instances

```bash
# Variables
RESOURCE_GROUP="hrms-production-rg"
CONTAINER_GROUP="hrms-prod-api"
IMAGE="ghcr.io/uabindia/hrms-api:1.0.0"
DNS_NAME="hrms-api-prod"

# Create container group
az container create \
  --resource-group $RESOURCE_GROUP \
  --name $CONTAINER_GROUP \
  --image $IMAGE \
  --cpu 2 \
  --memory 2 \
  --port 5000 \
  --dns-name-label $DNS_NAME \
  --environment-variables \
    ASPNETCORE_ENVIRONMENT="Production" \
    Jwt__Issuer="https://hrms.uabindia.com" \
  --secure-environment-variables \
    ConnectionStrings__DefaultConnection="$(az keyvault secret show --vault-name hrms-kv --name db-conn-string --query value -o tsv)" \
    Jwt__Key="$(az keyvault secret show --vault-name hrms-kv --name jwt-key --query value -o tsv)"
```

#### 3. Configure Azure Front Door (Load Balancer)

```bash
# Create Front Door
az network front-door create \
  --name hrms-prod-fd \
  --resource-group $RESOURCE_GROUP \
  --backend-address $(az container show --resource-group $RESOURCE_GROUP --name $CONTAINER_GROUP --query ipAddress.fqdn -o tsv) \
  --backend-host-header "hrms-api-prod.eastus.azurecontainers.io" \
  --accepted-protocols Http Https \
  --forwarding-protocol HttpsOnly
```

#### 4. Configure SSL/TLS

```bash
# Import certificate to Front Door
az network front-door frontend-endpoint create \
  --front-door-name hrms-prod-fd \
  --resource-group $RESOURCE_GROUP \
  --name api-endpoint \
  --host-name api.hrms.uabindia.com \
  --session-affinity-enabled false

# Add HTTPS listener
az network front-door backend-pool create \
  --name api-backend \
  --front-door-name hrms-prod-fd \
  --resource-group $RESOURCE_GROUP \
  --address api-prod.eastus.azurecontainers.io \
  --backend-host-header api-prod.eastus.azurecontainers.io
```

### Pre-Production Checklist

- [ ] All 16 tests passing (100%)
- [ ] Security headers validated
- [ ] Rate limiting configured
- [ ] Database backups enabled
- [ ] Application Insights configured
- [ ] Log retention policy set
- [ ] SSL/TLS certificate valid
- [ ] Database encryption enabled
- [ ] Firewall rules configured
- [ ] Monitoring alerts configured

---

## Monitoring & Alerting

### Application Insights Dashboard

```powershell
# Query response times
az monitor metrics list-definitions \
  --resource /subscriptions/{subscription}/resourceGroups/{rg}/providers/microsoft.insights/components/{app-insights} \
  --namespace "microsoft.insights/components"

# Query error rate
az monitor log-analytics query \
  --workspace {workspace-id} \
  --analytics-query "
    requests 
    | where timestamp > ago(1h) 
    | where resultCode >= 500 
    | summarize count() by resultCode
  "
```

### Key Metrics to Monitor

| Metric | Alert Threshold | Action |
|--------|---|---|
| API Response Time (p95) | > 1 second | Investigate query performance |
| Error Rate | > 5% | Page on-call engineer |
| CPU Usage | > 80% | Scale up or optimize |
| Memory Usage | > 85% | Check for memory leaks |
| Database Connections | > 90% of pool | Increase connection pool |
| Request Rate | > 10k/min | Check for DDoS |
| Failed Logins | > 100/min | Trigger security alert |

### Alert Configuration (PowerShell)

```powershell
# Create alert rule for high error rate
$rule = New-AzMetricAlertRuleV2 `
  -Name "HighErrorRate" `
  -ResourceGroupName "hrms-production-rg" `
  -TargetResourceType "microsoft.insights/components" `
  -TargetResourceName "hrms-prod-insights" `
  -MetricName "server/exceptions" `
  -Operator "GreaterThan" `
  -Threshold 50 `
  -WindowSize "PT5M" `
  -Frequency "PT1M"

# Add email action
$action = New-AzActionGroupReceiver `
  -Name "PagerDuty" `
  -EmailReceiver `
  -EmailAddress "alerts@uabindia.com"

Add-AzMetricAlertRuleAction -Rule $rule -Action $action
```

### Log Analytics Queries

```kusto
// API performance over time
requests
| where timestamp > ago(24h)
| summarize 
    Count=count(),
    AvgDuration=avg(duration),
    P95Duration=percentile(duration, 95),
    FailureRate=todouble(sum(case(resultCode >= 500, 1, 0))) / count() * 100
by bin(timestamp, 1h), resultCode

// Failed authentication attempts
customEvents
| where name == "AuthenticationFailed"
| summarize count() by tostring(customDimensions.UserEmail), tostring(customDimensions.Reason)

// Database query performance
dependencies
| where type == "SQL"
| where timestamp > ago(1h)
| summarize 
    Count=count(),
    AvgDuration=avg(duration),
    MaxDuration=max(duration)
by operation_Name
| order by AvgDuration desc
```

---

## Incident Response

### Critical Issues Escalation Path

**Level 1 (P1) - System Down:**
1. Alert triggered automatically
2. Page on-call engineer (PagerDuty)
3. Declare incident
4. Start war room (Teams/Zoom)
5. Target RTO: 15 minutes

**Response Procedures:**

```bash
# 1. Check system status
curl https://api.hrms.uabindia.com/health/live

# 2. View recent logs
az container logs --resource-group hrms-production-rg --name hrms-prod-api

# 3. Check Application Insights
az monitor app-insights metrics show \
  --app hrms-prod-insights \
  --resource-group hrms-production-rg \
  --metric "server/exceptions"

# 4. Check resource metrics
az container show \
  --resource-group hrms-production-rg \
  --name hrms-prod-api \
  --query instanceView
```

### Incident Response Playbook

#### Database Connection Pool Exhausted

**Symptoms:** HTTP 500 errors with "connection pool exhausted"

**Resolution:**
```sql
-- Check connection count
SELECT COUNT(*) as active_connections
FROM sys.dm_exec_sessions
WHERE database_id = DB_ID('HRMS');

-- Kill idle connections
ALTER DATABASE HRMS SET RESTRICTED_USER WITH ROLLBACK IMMEDIATE;
ALTER DATABASE HRMS SET MULTI_USER;

-- Increase connection pool size
-- Edit appsettings.Production.json: "Max Pool Size": 200 (default: 100)
```

#### High CPU Usage

**Symptoms:** API slow, timeouts, elevated CPU > 80%

**Resolution:**
```bash
# 1. Check running queries
az monitor app-insights metrics show \
  --app hrms-prod-insights \
  --resource-group hrms-production-rg \
  --metric "Processor (%) Time"

# 2. Scale up container
az container update \
  --resource-group hrms-production-rg \
  --name hrms-prod-api \
  --cpu 4 \
  --memory 4

# 3. Optimize slow queries
# Review Application Insights for slow dependencies
```

#### Memory Leak

**Symptoms:** Memory usage gradually increasing, restarts help temporarily

**Resolution:**
```bash
# 1. Enable memory dump
dotnet trace collect --process-id $PID --providers Microsoft-Windows-DotNETRuntime:0:5

# 2. Analyze dump
dotnet gcdump collect -p $PID

# 3. Restart container (temporary fix)
az container restart \
  --resource-group hrms-production-rg \
  --name hrms-prod-api

# 4. Code review for unmanaged resources
# Check for missing Dispose() calls
```

---

## Maintenance Procedures

### Weekly Maintenance

**Every Monday, 02:00 UTC:**

```bash
# 1. Database integrity check
DBCC CHECKDB (HRMS);

# 2. Index maintenance
ALTER INDEX ALL ON [dbo].[Employees] REBUILD;
ALTER INDEX ALL ON [dbo].[Attendance] DEFRAG;

# 3. Update statistics
EXEC sp_updatestats;

# 4. Backup verification
RESTORE HEADERONLY FROM DISK = '/backups/latest/HRMS_full.bak';
```

### Monthly Maintenance

**First Sunday, 02:00 UTC (Scheduled Downtime: 30 min):**

1. **Database Maintenance**
```sql
-- Rebuild indexes
EXEC sp_MSForEachTable 'ALTER INDEX ALL ON ? REBUILD';

-- Purge old audit logs
DELETE FROM AuditLogs WHERE CreatedAt < DATEADD(YEAR, -7, GETDATE());

-- Update statistics
EXEC sp_updatestats;
```

2. **Application Update**
```bash
# Pull latest code
git pull origin main

# Build new image
docker build -f Dockerfile.prod -t hrms-api:latest .

# Deploy with blue-green strategy
docker run --name hrms-api-new hrms-api:latest
curl http://localhost:5000/health/live  # Verify health
docker rm hrms-api-old
docker rename hrms-api-new hrms-api
```

3. **SSL/TLS Certificate Renewal**
```bash
# Check expiration
curl -v https://api.hrms.uabindia.com 2>&1 | grep "expire date"

# Renew if expiring within 30 days
az keyvault certificate import \
  --vault-name hrms-kv \
  --name api-cert \
  --file ./api.hrms.uabindia.com.pfx \
  --password $CERT_PASSWORD
```

### Backup Procedures

**Daily Full Backup (02:00 UTC):**
```sql
BACKUP DATABASE [HRMS] 
TO DISK = '/backups/daily/HRMS_' + CONVERT(VARCHAR(10), GETDATE(), 112) + '.bak'
WITH COMPRESSION, INIT, STATS = 10;

-- Copy to Azure Blob Storage
azcopy copy "/backups/daily/*" "https://hrmsbackups.blob.core.windows.net/backups/" --recursive
```

**Hourly Transaction Log Backup (every hour):**
```sql
BACKUP LOG [HRMS]
TO DISK = '/backups/logs/HRMS_' + REPLACE(CONVERT(VARCHAR(19), GETDATE(), 120), ':', '-') + '.trn'
WITH COMPRESSION, INIT, STATS = 10;
```

**Restore Procedure (after disaster):**
```sql
-- 1. Restore full backup
RESTORE DATABASE [HRMS] 
FROM DISK = '/backups/daily/HRMS_20260203.bak' 
WITH NORECOVERY, REPLACE;

-- 2. Restore latest transaction logs
RESTORE LOG [HRMS] 
FROM DISK = '/backups/logs/HRMS_*.trn'
WITH RECOVERY;
```

---

## Troubleshooting Guide

### Common Issues & Resolutions

| Issue | Cause | Resolution |
|-------|-------|------------|
| 401 Unauthorized | Expired JWT token | Refresh token via POST /auth/refresh-token |
| 403 Forbidden | Insufficient permissions | Check user roles in database |
| 429 Too Many Requests | Rate limit exceeded | Wait 1 minute or request higher quota |
| 500 Internal Server Error | Database connection failed | Check database is online and accessible |
| 503 Service Unavailable | Container down | Check Azure Container status and logs |

### Debug Mode

```bash
# Enable debug logging
export ASPNETCORE_ENVIRONMENT=Development
export SERILOG__MINIMUMLEVEL=Debug

# Restart application
dotnet run

# View detailed logs
tail -f logs/application-debug.log

# Enable detailed SQL logging
export EF_CORE_LOG_LEVEL=Debug
```

### Performance Diagnostics

```bash
# CPU profiling
dotnet trace collect -p $PID --output trace.nettrace

# Analyze trace
dotnet trace convert trace.nettrace

# Memory dump
dotnet gcdump collect -p $PID

# View heap
dotnet dump analyze core.20260203.dump
```

---

**Document Owner:** DevOps Team  
**Last Updated:** February 3, 2026  
**Next Review:** August 3, 2026  
**Emergency Contact:** devops@uabindia.com
