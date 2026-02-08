# Production Deployment Checklist

**HRMS/ERP System - Enterprise Security Hardening**  
**Version:** 1.0  
**Last Updated:** February 3, 2026

---

## Pre-Deployment Security Checklist

### 1. Configuration Validation ✅

#### Database Configuration
- [ ] **Connection String**: Remove `Trusted_Connection=True` if using SQL authentication
- [ ] **Database Encryption**: Enable Transparent Data Encryption (TDE) on SQL Server
- [ ] **Connection Pooling**: Verify `MultipleActiveResultSets=true` for EF Core
- [ ] **SSL/TLS**: Ensure `Encrypt=True;TrustServerCertificate=False` in production

#### JWT Authentication
- [ ] **Secret Key**: Generate cryptographically secure key (min 64 characters)
  ```bash
  # PowerShell command to generate secure key
  -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
  ```
- [ ] **Key Storage**: Store in Azure Key Vault or environment variables (NEVER in appsettings.json)
- [ ] **Issuer/Audience**: Set to production domain (e.g., `https://api.hrms.uabindia.com`)
- [ ] **Token Expiry**: Verify access token = 15 min, refresh token = 7 days

#### CORS Configuration
- [ ] **Allowed Origins**: Remove all `localhost` entries
- [ ] **Production Origins**: Add only verified production domains
  ```json
  {
    "Cors": {
      "AllowedOrigins": [
        "https://hrms.uabindia.com",
        "https://app.uabindia.com"
      ]
    }
  }
  ```
- [ ] **Credentials**: Ensure `AllowCredentials = true` for cookie-based auth

#### Application Insights
- [ ] **Connection String**: Configure Azure Application Insights
- [ ] **Adaptive Sampling**: Enable for high-traffic scenarios
- [ ] **Log Level**: Set to `Information` or `Warning` in production
- [ ] **PII Filtering**: Ensure no passwords/tokens logged

---

### 2. Security Headers Validation ✅

Run security headers check on deployed site: https://securityheaders.com/

**Required Headers:**
```http
Content-Security-Policy: default-src 'self'; ...
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

**Verification Commands:**
```bash
# Check headers on production
curl -I https://api.hrms.uabindia.com/health | grep -E "X-|Content-Security|Strict-Transport"

# PowerShell equivalent
(Invoke-WebRequest -Uri "https://api.hrms.uabindia.com/health" -Method Head).Headers
```

---

### 3. Rate Limiting Configuration ✅

#### IP-Based Limits
- [x] **Per-IP Limit**: 100 requests/minute (DDoS protection)
- [ ] **Production Tuning**: Adjust based on load testing
- [ ] **Whitelist**: Consider whitelisting known IPs (mobile apps, partners)

#### Tenant-Based Limits
- [x] **Per-Tenant Limit**: 10,000 requests/day (fair usage)
- [ ] **Tier-Based Limits**: Implement different limits per subscription tier
  - Free: 1,000 req/day
  - Pro: 10,000 req/day
  - Enterprise: 100,000 req/day

---

### 4. GDPR Compliance ✅

#### APIs Deployed
- [x] **Export User Data**: `POST /api/v1/privacy/export-user-data`
- [x] **Delete User**: `POST /api/v1/privacy/delete-user`
- [x] **Privacy Policy**: `GET /api/v1/privacy/policy`

#### Data Retention
- [x] **Active Records**: As long as account is active
- [x] **Soft-Deleted**: 90 days before permanent deletion
- [x] **Audit Logs**: 7 years (compliance requirement)
- [ ] **Automated Cleanup**: Schedule job to purge old deleted records

#### User Rights
- [x] Right to Access (Article 15)
- [x] Right to Erasure (Article 17)
- [x] Right to Data Portability (Article 20)
- [ ] Right to Rectification (Article 16) - via standard update APIs
- [ ] Right to Restriction of Processing (Article 18) - implement freeze account

---

### 5. Infrastructure Security 🔄

#### Azure/Cloud Configuration
- [ ] **Azure Key Vault**: Store all secrets (JWT key, DB password, API keys)
  ```bash
  az keyvault secret set --vault-name hrms-keyvault --name JwtSigningKey --value "your-key"
  ```
- [ ] **Managed Identity**: Use Azure Managed Identity for Key Vault access
- [ ] **Network Security Groups**: Restrict traffic to SQL Server (only from API subnet)
- [ ] **Azure SQL Firewall**: Allow only API app service IPs
- [ ] **DDoS Protection**: Enable Azure DDoS Standard

#### SSL/TLS Configuration
- [ ] **TLS Version**: Minimum TLS 1.2, prefer TLS 1.3
- [ ] **Certificate**: Use trusted CA certificate (Let's Encrypt, DigiCert, etc.)
- [ ] **HSTS**: Enable Strict-Transport-Security header
- [ ] **Certificate Expiry**: Set up renewal alerts (30 days before expiry)

#### Database Security
- [ ] **TDE (Transparent Data Encryption)**: Enable on SQL Server
  ```sql
  USE master;
  CREATE MASTER KEY ENCRYPTION BY PASSWORD = 'strong_password';
  CREATE CERTIFICATE TDE_Cert WITH SUBJECT = 'TDE Certificate';
  USE UabIndia_HRMS;
  CREATE DATABASE ENCRYPTION KEY
  WITH ALGORITHM = AES_256
  ENCRYPTION BY SERVER CERTIFICATE TDE_Cert;
  ALTER DATABASE UabIndia_HRMS SET ENCRYPTION ON;
  ```
- [ ] **SQL Auditing**: Enable Azure SQL Auditing
- [ ] **Backup Encryption**: Ensure backups are encrypted
- [ ] **Firewall Rules**: Restrict access to known IPs only

#### Web Application Firewall (WAF)
- [ ] **Azure Front Door / Application Gateway**: Deploy with WAF enabled
- [ ] **OWASP Top 10 Protection**: Enable managed rule sets
- [ ] **Custom Rules**: Block suspicious patterns (SQL injection, XSS)
- [ ] **Rate Limiting**: Additional layer at WAF level

---

### 6. Monitoring & Alerting 🔄

#### Application Insights Dashboards
- [ ] **Performance Metrics**: Response time, throughput, errors
- [ ] **Dependency Tracking**: SQL queries, external API calls
- [ ] **Custom Events**: User logins, GDPR exports, deletions
- [ ] **Availability Tests**: Health check pings every 5 minutes

#### Alerts Configuration
- [ ] **Critical Alerts**:
  - API down (health check fails for 2 minutes)
  - Database connection failures (> 5 in 5 minutes)
  - Authentication failures spike (> 100 in 1 minute - possible brute force)
  - Rate limit violations (> 1000 in 5 minutes - possible attack)
  
- [ ] **Warning Alerts**:
  - High response time (> 2 seconds for 5 minutes)
  - High CPU usage (> 80% for 10 minutes)
  - Memory pressure (> 90% for 5 minutes)
  - Failed GDPR operations

#### Log Retention
- [ ] **Application Logs**: 90 days in Application Insights
- [ ] **Security Logs**: 365 days (compliance)
- [ ] **Audit Logs**: 7 years in SQL database
- [ ] **Diagnostic Logs**: 30 days

---

### 7. Testing & Validation ✅

#### Automated Tests
- [x] **Unit Tests**: 16 tests passing (multi-tenancy + GDPR)
- [ ] **Integration Tests**: End-to-end API testing
- [ ] **Load Tests**: 100 concurrent users, 1000 req/sec sustained
- [ ] **Security Tests**: OWASP ZAP, Burp Suite scanning

#### Manual Testing
- [ ] **Penetration Testing**: Hire security firm for audit
- [ ] **Vulnerability Scanning**: Run Nessus/Qualys scan
- [ ] **SQL Injection Testing**: Test all input fields
- [ ] **XSS Testing**: Test with malicious scripts
- [ ] **CSRF Testing**: Verify origin validation works

#### Compliance Testing
- [ ] **GDPR Export**: Verify data completeness
- [ ] **GDPR Delete**: Verify anonymization works
- [ ] **Data Retention**: Verify cleanup jobs run
- [ ] **Audit Logs**: Verify all actions logged

---

### 8. Deployment Process 🔄

#### Pre-Deployment
- [ ] **Backup Database**: Full backup before deployment
- [ ] **Migration Scripts**: Test on staging environment
- [ ] **Rollback Plan**: Document rollback procedures
- [ ] **Maintenance Window**: Schedule during low-traffic hours

#### Deployment Steps
1. [ ] Set Application Insights connection string in environment variables
2. [ ] Configure JWT key in Azure Key Vault
3. [ ] Update database connection string with production credentials
4. [ ] Run `dotnet ef database update` for migrations
5. [ ] Deploy API to Azure App Service / Kubernetes
6. [ ] Verify health check: `GET /health/ready`
7. [ ] Smoke test: Login, create record, delete record
8. [ ] Monitor Application Insights for errors

#### Post-Deployment
- [ ] **Health Checks**: Verify `/health`, `/health/live`, `/health/ready`
- [ ] **Security Headers**: Run securityheaders.com scan
- [ ] **Performance**: Check Application Insights metrics
- [ ] **Error Logs**: Review for any deployment issues
- [ ] **User Acceptance Testing**: Pilot users test critical flows

---

### 9. Continuous Security 🔄

#### Monthly Tasks
- [ ] Review Application Insights security events
- [ ] Audit user access logs for suspicious activity
- [ ] Check for expired SSL certificates
- [ ] Review rate limiting effectiveness
- [ ] Update dependencies (NuGet packages)

#### Quarterly Tasks
- [ ] Security vulnerability scan (OWASP ZAP)
- [ ] Review and update CORS allowed origins
- [ ] Audit GDPR compliance (data retention, deletion logs)
- [ ] Performance optimization review
- [ ] Disaster recovery drill (restore from backup)

#### Annual Tasks
- [ ] Penetration testing by external firm
- [ ] SOC 2 audit (if pursuing certification)
- [ ] Review and update privacy policy
- [ ] Security training for development team
- [ ] Infrastructure architecture review

---

## Environment-Specific Configuration

### Development Environment
```json
{
  "Jwt": {
    "Key": "dev-only-change-this-to-a-strong-secret",
    "Issuer": "uabindia-dev",
    "Audience": "uabindia_clients_dev"
  },
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:5173"
    ]
  },
  "ApplicationInsights": {
    "ConnectionString": ""
  }
}
```

### Staging Environment
```json
{
  "Jwt": {
    "Key": "${AZURE_KEYVAULT:JwtSigningKey}",
    "Issuer": "https://api-staging.hrms.uabindia.com",
    "Audience": "hrms_clients"
  },
  "Cors": {
    "AllowedOrigins": [
      "https://staging.hrms.uabindia.com"
    ]
  },
  "ApplicationInsights": {
    "ConnectionString": "${AZURE_KEYVAULT:AppInsightsConnectionString}"
  }
}
```

### Production Environment
```json
{
  "Jwt": {
    "Key": "${AZURE_KEYVAULT:JwtSigningKey}",
    "Issuer": "https://api.hrms.uabindia.com",
    "Audience": "hrms_clients"
  },
  "Cors": {
    "AllowedOrigins": [
      "https://hrms.uabindia.com",
      "https://app.uabindia.com"
    ]
  },
  "ApplicationInsights": {
    "ConnectionString": "${AZURE_KEYVAULT:AppInsightsConnectionString}"
  },
  "RateLimiting": {
    "IpLimit": 100,
    "TenantDailyLimit": 10000
  }
}
```

---

## Critical Commands Reference

### Generate Secure JWT Key (PowerShell)
```powershell
# Generate 64-character alphanumeric key
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})

# Generate using .NET
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Minimum 0 -Maximum 255 }))
```

### Database TDE Setup (SQL Server)
```sql
-- Create master key
USE master;
CREATE MASTER KEY ENCRYPTION BY PASSWORD = 'ComplexPassword123!';

-- Create certificate
CREATE CERTIFICATE TDE_Cert WITH SUBJECT = 'TDE Certificate for HRMS';

-- Backup certificate (IMPORTANT!)
BACKUP CERTIFICATE TDE_Cert
TO FILE = 'C:\Backup\TDE_Cert'
WITH PRIVATE KEY (
    FILE = 'C:\Backup\TDE_Cert_Key',
    ENCRYPTION BY PASSWORD = 'CertPassword123!'
);

-- Enable TDE on database
USE UabIndia_HRMS;
CREATE DATABASE ENCRYPTION KEY
WITH ALGORITHM = AES_256
ENCRYPTION BY SERVER CERTIFICATE TDE_Cert;

ALTER DATABASE UabIndia_HRMS SET ENCRYPTION ON;

-- Verify encryption
SELECT name, is_encrypted FROM sys.databases WHERE name = 'UabIndia_HRMS';
```

### Azure Key Vault Setup
```bash
# Create Key Vault
az keyvault create --name hrms-keyvault --resource-group hrms-rg --location eastus

# Store JWT key
az keyvault secret set --vault-name hrms-keyvault --name JwtSigningKey --value "your-64-char-key"

# Grant App Service access
az webapp identity assign --resource-group hrms-rg --name hrms-api
az keyvault set-policy --name hrms-keyvault --object-id <managed-identity-id> --secret-permissions get list
```

---

## Sign-Off

### Development Team
- [ ] Security features implemented and tested
- [ ] Code reviewed and approved
- [ ] Documentation updated

### Security Team
- [ ] Security scan completed
- [ ] Vulnerabilities resolved
- [ ] Compliance requirements met

### Operations Team
- [ ] Infrastructure configured
- [ ] Monitoring enabled
- [ ] Backup strategy implemented

### Management Approval
- [ ] Risk assessment reviewed
- [ ] Budget approved
- [ ] Go-live date confirmed

---

**Deployment Status:** Phase 3 In Progress  
**Next Review Date:** [Date]  
**Signed Off By:** [Name], [Title], [Date]
