# Disaster Recovery & Business Continuity Plan

**HRMS/ERP System - Enterprise Resilience**  
**Version:** 1.0  
**Last Updated:** February 3, 2026  
**Classification:** Internal - Confidential

---

## Executive Summary

This document outlines the disaster recovery (DR) and business continuity (BC) procedures for the HRMS/ERP system, ensuring critical business functions continue during unexpected incidents.

**Recovery Objectives:**
- **RTO (Recovery Time Objective):** 4 hours
- **RPO (Recovery Point Objective):** 1 hour
- **Availability Target:** 99.5% uptime (SLA: 99.9%)

---

## 1. Backup Strategy

### 1.1 Database Backups

#### Full Backup Schedule
```sql
-- Daily at 02:00 UTC
BACKUP DATABASE [UabIndia_HRMS]
TO DISK = '\\backup-server\sql-backups\UabIndia_HRMS_FULL_$(DATE).bak'
WITH 
    COPY_ONLY,
    COMPRESSION,
    INIT,
    NAME = 'Full Backup of UabIndia_HRMS',
    DESCRIPTION = 'Daily full backup',
    STATS = 10,
    CHECKSUM;

-- Verify backup
RESTORE VERIFYONLY 
FROM DISK = '\\backup-server\sql-backups\UabIndia_HRMS_FULL_$(DATE).bak';
```

#### Transaction Log Backup Schedule
```sql
-- Every 15 minutes (hourly during business hours, 2x daily off-hours)
BACKUP LOG [UabIndia_HRMS]
TO DISK = '\\backup-server\sql-backups\UabIndia_HRMS_LOG_$(DATETIME).trn'
WITH 
    COMPRESSION,
    INIT,
    NAME = 'Transaction Log Backup',
    STATS = 10;
```

#### Differential Backup Schedule
```sql
-- Daily at 14:00 UTC (between full backups)
BACKUP DATABASE [UabIndia_HRMS]
TO DISK = '\\backup-server\sql-backups\UabIndia_HRMS_DIFF_$(DATE).bak'
WITH 
    DIFFERENTIAL,
    COMPRESSION,
    INIT,
    NAME = 'Differential Backup',
    STATS = 10;
```

### 1.2 Backup Storage & Retention

| Backup Type | Frequency | Retention | Location | Redundancy |
|-------------|-----------|-----------|----------|-----------|
| Full | Daily | 30 days | Primary datacenter | Yes (3x replicated) |
| Differential | Daily | 14 days | Primary datacenter | Yes (3x replicated) |
| Transaction Log | Every 15 min | 7 days | Primary datacenter | Yes (3x replicated) |
| Weekly Archive | Weekly | 52 weeks | Secondary datacenter | Yes (geographically redundant) |
| Monthly Archive | Monthly | 7 years | Tertiary storage (vault) | Yes (encrypted) |

### 1.3 Application Backups

#### Source Code Repository
```bash
# GitHub automatic backups (included with GitHub Enterprise)
# Manual weekly backup to Azure Blob Storage
az backup container create --vault-name hrms-vault --backup-type git --storage-account hrms-backups
```

#### Configuration Files
```bash
# Backup appsettings files (encrypted)
az backup item backup-now --resource-group hrms-rg --vault-name hrms-vault \
  --container-name appsettings --item-name appsettings-prod
```

#### Azure Key Vault Backup
```bash
# Daily backup of secrets and keys
az keyvault backup start --hsm-name hrms-keyvault --storage-account-name hrmsbkp
```

---

## 2. Disaster Recovery Scenarios

### Scenario 1: Database Corruption

**Detection:** 
- DBCC CHECKDB reports errors
- Application errors: "Cannot open database"
- Monitoring alert: Database integrity check failed

**Recovery Steps:**

```sql
-- Step 1: Take database offline
ALTER DATABASE [UabIndia_HRMS] SET OFFLINE;

-- Step 2: Restore from most recent clean backup
RESTORE DATABASE [UabIndia_HRMS]
FROM DISK = '\\backup-server\sql-backups\UabIndia_HRMS_FULL_LastGood.bak'
WITH 
    REPLACE,
    RECOVERY,
    STATS = 10;

-- Step 3: Verify integrity
DBCC CHECKDB ([UabIndia_HRMS]);

-- Step 4: Check transaction logs
RESTORE LOG [UabIndia_HRMS]
FROM DISK = '\\backup-server\sql-backups\UabIndia_HRMS_LOG_*.trn'
WITH RECOVERY;

-- Step 5: Verify application connectivity
SELECT * FROM sys.dm_exec_connections WHERE database_id = DB_ID('UabIndia_HRMS');
```

**RTO:** 30-60 minutes  
**RPO:** 15 minutes (latest transaction log)

---

### Scenario 2: Primary Datacenter Outage

**Detection:**
- Health check endpoint returns 503 Service Unavailable
- Multiple consecutive ping failures from monitoring
- Azure status reports datacenter incident

**Recovery Steps:**

1. **Activate Failover to Secondary Datacenter**
```bash
# 1. Promote secondary database to primary
az sql server failover-group set-primary \
  --resource-group hrms-rg \
  --name hrms-failover-group \
  --server hrms-secondary-db

# 2. Update DNS to point to secondary region
az network dns record-set a update \
  --resource-group hrms-rg \
  --zone-name hrms.uabindia.com \
  --name api \
  --ipv4-address <secondary-ip>

# 3. Verify failover
curl -I https://api.hrms.uabindia.com/health/live
```

2. **Restore Application Services**
```bash
# 1. Deploy API to secondary region
az container create \
  --resource-group hrms-rg \
  --name hrms-api-secondary \
  --image ghcr.io/uabindia/hrms-api:latest \
  --cpu 4 --memory 8

# 2. Restore frontend from CDN cache (automatic)
# 3. Verify all health checks passing
```

**RTO:** 4 hours  
**RPO:** 1 hour

---

### Scenario 3: Application Code Corruption / Bad Deployment

**Detection:**
- 5XX errors after recent deployment
- Critical functionality unavailable
- Health check endpoint returning errors

**Recovery Steps:**

```bash
# Step 1: Identify last good version
git log --oneline | head -20

# Step 2: Rollback to previous version
git revert <bad-commit-hash>
git push origin main

# Step 3: Trigger automated redeployment
# (GitHub Actions pipeline automatically starts)

# Step 4: Monitor Application Insights for error reduction
# Query: requests | where resultCode >= 500 | summarize count() by bin(timestamp, 5m)

# Step 5: Verify health checks
for i in {1..10}; do
  curl https://api.hrms.uabindia.com/health/ready && break
  sleep 30
done
```

**RTO:** 15-30 minutes  
**RPO:** 0 minutes (code rollback)

---

### Scenario 4: Security Incident / Data Breach

**Detection:**
- Unauthorized access attempt detected
- Suspicious database queries in audit logs
- Security tool alerts (WAF, IDS)

**Response Procedure:**

```bash
# Step 1: Isolate affected systems
az network nsg rule create \
  --resource-group hrms-rg \
  --nsg-name hrms-nsg \
  --name deny-all-incident \
  --priority 100 \
  --direction Inbound \
  --access Deny

# Step 2: Snapshot current state for forensics
az sql db copy \
  --resource-group hrms-rg \
  --server hrms-prod \
  --name UabIndia_HRMS \
  --dest-name UabIndia_HRMS_Forensics

# Step 3: Restore from clean backup (24 hours before incident)
RESTORE DATABASE [UabIndia_HRMS]
FROM DISK = '\\backup-server\sql-backups\UabIndia_HRMS_FULL_LastClean.bak'
WITH REPLACE, RECOVERY;

# Step 4: Rotate secrets
az keyvault secret set \
  --vault-name hrms-keyvault \
  --name JwtSigningKey \
  --value "$(openssl rand -base64 48)"

az keyvault secret set \
  --vault-name hrms-keyvault \
  --name DatabasePassword \
  --value "$(openssl rand -base64 32)"

# Step 5: Audit all access logs
SELECT * FROM sys.dm_exec_sessions 
WHERE database_id = DB_ID('UabIndia_HRMS')
AND login_time > DATEADD(hour, -24, GETDATE());

# Step 6: Notify affected users (GDPR compliance)
# Send email: "We detected unauthorized access to your account..."
# Provide: password reset link, 2FA setup, fraud alert option
```

**RTO:** 2 hours  
**RPO:** 24 hours  
**Actions:** Security audit, password reset for all users, 2FA enforcement

---

## 3. Backup Verification & Testing

### 3.1 Monthly Restore Test

```sql
-- Create test database from backup
RESTORE DATABASE [UabIndia_HRMS_TEST]
FROM DISK = '\\backup-server\sql-backups\UabIndia_HRMS_FULL_LatestMonthly.bak'
WITH 
    MOVE 'UabIndia_HRMS_data' TO 'D:\SQL\UabIndia_HRMS_TEST.mdf',
    MOVE 'UabIndia_HRMS_log' TO 'D:\SQL\UabIndia_HRMS_TEST.ldf',
    REPLACE,
    RECOVERY;

-- Run integrity checks
DBCC CHECKDB ([UabIndia_HRMS_TEST]);

-- Verify data completeness
SELECT 
    'Companies' AS TableName, COUNT(*) AS RowCount FROM [UabIndia_HRMS_TEST].[dbo].[Companies]
UNION ALL
SELECT 'Users', COUNT(*) FROM [UabIndia_HRMS_TEST].[dbo].[Users]
UNION ALL
SELECT 'Employees', COUNT(*) FROM [UabIndia_HRMS_TEST].[dbo].[Employees]
UNION ALL
SELECT 'AuditLogs', COUNT(*) FROM [UabIndia_HRMS_TEST].[dbo].[AuditLogs];

-- Verify most recent transaction timestamp
SELECT MAX(CreatedAt) AS LatestTransaction 
FROM [UabIndia_HRMS_TEST].[dbo].[AuditLogs];

-- Cleanup
DROP DATABASE [UabIndia_HRMS_TEST];
```

### 3.2 Automated Backup Verification

```powershell
# PowerShell script: Verify-Backups.ps1
$backupPath = "\\backup-server\sql-backups"
$alertEmail = "ops@uabindia.com"

Get-ChildItem $backupPath -Filter "UabIndia_HRMS_*.bak" | ForEach-Object {
    $backupFile = $_.FullName
    
    # Verify backup file integrity
    $verify = Invoke-Sqlcmd -ServerInstance "HRMS-BACKUP-TEST" -Query "
        RESTORE VERIFYONLY FROM DISK = '$backupFile'
    "
    
    if ($verify -like "*failed*") {
        Send-MailMessage -To $alertEmail `
            -Subject "BACKUP VERIFICATION FAILED: $($_.Name)" `
            -Body "Backup file failed verification: $backupFile"
    }
    
    # Check backup age
    $backupAge = (Get-Date) - $_.LastWriteTime
    if ($backupAge.Days -gt 7) {
        Write-Warning "Backup is older than 7 days: $($_.Name)"
    }
}

# Verify backup storage has space
$backupDrive = Get-Volume -DriveLetter (Split-Path $backupPath)[0]
if ($backupDrive.SizeRemaining -lt 500GB) {
    Send-MailMessage -To $alertEmail `
        -Subject "BACKUP STORAGE WARNING" `
        -Body "Backup storage has less than 500GB free space"
}
```

---

## 4. Communication Plan

### 4.1 Incident Notification

**Tier 1 - Critical (RTO < 1 hour)**
- CEO, COO, CTO
- All Operations team members
- Key customer accounts (if SLA affected)

**Tier 2 - High (RTO 1-4 hours)**
- Operations team lead
- Support team
- Customer success team

**Tier 3 - Medium (RTO 4-24 hours)**
- Development team
- Operations team
- Support team

**Notification Template:**
```
INCIDENT NOTIFICATION - HRMS System
Time: 2026-02-03 14:30 UTC
Severity: [CRITICAL | HIGH | MEDIUM]
Affected Services: [API | Database | Frontend]
Estimated Impact: [X] users, [Y] tenants
RTO: [X] hours
Status: [INVESTIGATING | IN PROGRESS | RESOLVED]
Next Update: [Time]
```

---

## 5. Runbook Quick Reference

### Quick Steps for Common Scenarios

**Database is down:**
1. Check SQL Server service: `Get-Service MSSQLSERVER`
2. Check Application Insights: Look for database connection errors
3. Failover to secondary: `az sql server failover-group set-primary`
4. Restore from backup if corrupted

**API is throwing 5XX errors:**
1. Check Application Insights exceptions dashboard
2. Review recent deployments: `git log --oneline | head -5`
3. Rollback if needed: `git revert` + `git push`
4. Monitor recovery: `curl https://api.hrms.uabindia.com/health`

**Security incident detected:**
1. Isolate systems: Block network access
2. Snapshot forensics database
3. Restore from clean backup
4. Rotate all secrets in Key Vault
5. Notify security team and affected users

---

## 6. Maintenance Window Procedures

### Monthly Maintenance (First Sunday, 02:00-04:00 UTC)

```bash
#!/bin/bash
# Maintenance Window Script

echo "Starting maintenance window..."

# 1. Verify backups are current
sqlcmd -S hrms-prod -Q "DBCC CHECKDB('UabIndia_HRMS')"

# 2. Rebuild indexes
sqlcmd -S hrms-prod -Q "
ALTER INDEX ALL ON UabIndia_HRMS.dbo.Companies REBUILD;
ALTER INDEX ALL ON UabIndia_HRMS.dbo.Employees REBUILD;
ALTER INDEX ALL ON UabIndia_HRMS.dbo.Users REBUILD;
ALTER INDEX ALL ON UabIndia_HRMS.dbo.LeaveRequests REBUILD;
"

# 3. Update statistics
sqlcmd -S hrms-prod -Q "EXEC sp_updatestats"

# 4. Purge old audit logs (older than 90 days)
sqlcmd -S hrms-prod -Q "
DELETE FROM AuditLogs 
WHERE CreatedAt < DATEADD(day, -90, GETDATE());
"

# 5. Archive old soft-deleted records (older than 90 days)
sqlcmd -S hrms-prod -Q "
DELETE FROM Companies 
WHERE IsDeleted = 1 AND UpdatedAt < DATEADD(day, -90, GETDATE());
"

echo "Maintenance window completed"
```

---

## 7. Testing Schedule

| Test | Frequency | Duration | RTO Target |
|------|-----------|----------|------------|
| Backup verification | Weekly | 30 min | N/A |
| Restore test | Monthly | 2 hours | < 60 min |
| Failover drill | Quarterly | 4 hours | < 4 hours |
| Full DR test | Semi-annually | 8 hours | < 4 hours |
| Security incident sim | Annually | 4 hours | < 2 hours |

---

## 8. Sign-Off & Approval

### Document Owners
- **Created By:** DevOps Team
- **Reviewed By:** Security Officer, Database Administrator
- **Approved By:** CTO, Operations Director
- **Last Updated:** February 3, 2026
- **Next Review:** August 3, 2026

### Acknowledgment
All team members involved in disaster recovery must review and acknowledge this plan annually.

```
Print Name: _________________  Signature: _________________  Date: _______
Print Name: _________________  Signature: _________________  Date: _______
Print Name: _________________  Signature: _________________  Date: _______
```

---

**Document Classification:** Internal - Confidential  
**Distribution:** Operations Team, Development Team, Management  
**Retention:** 3 years
