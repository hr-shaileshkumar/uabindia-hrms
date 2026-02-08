# GDPR Privacy API Quick Reference

## Overview
These APIs implement GDPR compliance for the HRMS system, allowing users to exercise their data rights.

---

## 1. Export User Data (GDPR Article 15)

**Endpoint:** `POST /api/v1/privacy/export-user-data`  
**Authorization:** Admin only  
**Purpose:** Export all personal data for a user in machine-readable format

### Request
```json
{
  "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

### Response (200 OK)
```json
{
  "message": "User data export completed",
  "format": "JSON",
  "dataPackage": {
    "ExportDate": "2026-02-03T10:00:00Z",
    "UserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "TenantId": "tenant-guid",
    "PersonalInformation": {
      "Email": "user@example.com",
      "IsActive": true,
      "CreatedAt": "2025-01-01T00:00:00Z",
      "UpdatedAt": "2026-02-03T10:00:00Z"
    },
    "Roles": [
      {
        "Name": "Employee",
        "Description": "Regular employee"
      }
    ],
    "EmployeeRecords": [
      {
        "Id": "employee-guid",
        "FullName": "John Doe",
        "EmployeeCode": "EMP001",
        "Status": "Active",
        "CreatedAt": "2025-01-01T00:00:00Z"
      }
    ],
    "LeaveRequests": [
      {
        "Id": "leave-guid",
        "FromDate": "2026-01-15",
        "ToDate": "2026-01-20",
        "Days": 5,
        "Status": "Approved",
        "Reason": "Vacation"
      }
    ],
    "AuditLogs": [
      {
        "Action": "Modified",
        "EntityName": "Employee",
        "PerformedAt": "2026-02-01T12:00:00Z",
        "OldValue": "{...}",
        "NewValue": "{...}"
      }
    ],
    "DataProcessingConsent": {
      "ConsentGiven": true,
      "ConsentDate": "2025-01-01T00:00:00Z",
      "Purpose": "HRMS and payroll management"
    }
  }
}
```

### Error Responses
- **404 Not Found:** User not found or does not belong to this tenant
- **401 Unauthorized:** Not authenticated
- **403 Forbidden:** Not an admin user

### cURL Example
```bash
curl -X POST https://api.uabindia.com/api/v1/privacy/export-user-data \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"}'
```

---

## 2. Delete User (GDPR Article 17)

**Endpoint:** `POST /api/v1/privacy/delete-user`  
**Authorization:** Admin only  
**Purpose:** Anonymize and delete user data (Right to be Forgotten)

### Request
```json
{
  "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "reason": "User requested deletion via support ticket #12345"
}
```

### Response (200 OK)
```json
{
  "message": "User data deletion completed",
  "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "deletedEntities": 15,
  "deletionDate": "2026-02-03T10:00:00Z",
  "reason": "User requested deletion via support ticket #12345",
  "compliance": "GDPR Article 17 - Right to Erasure",
  "note": "User data has been anonymized and soft-deleted. Audit trail retained for compliance."
}
```

### What Gets Deleted/Anonymized
1. **User Record:**
   - `IsDeleted = true`
   - Email changed to `deleted-{userId}@anonymized.local`
   
2. **User Roles:** Soft deleted (`IsDeleted = true`)

3. **Refresh Tokens:** Revoked (`IsRevoked = true`)

4. **Audit Log:** Created entry documenting the deletion (retained for compliance)

### What Gets Retained
- Audit logs (7-year retention for legal compliance)
- Anonymized user record (referential integrity)
- Historical data with anonymized user reference

### Safeguards
- ❌ Cannot delete system admin accounts
- ❌ Cannot delete your own account
- ✅ Requires admin authorization
- ✅ Creates audit trail

### Error Responses
- **400 Bad Request:** 
  - `"Cannot delete system admin account"`
  - `"Cannot delete your own account"`
- **404 Not Found:** User not found or does not belong to this tenant
- **401 Unauthorized:** Not authenticated
- **403 Forbidden:** Not an admin user

### cURL Example
```bash
curl -X POST https://api.uabindia.com/api/v1/privacy/delete-user \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "reason": "User requested deletion via support ticket #12345"
  }'
```

---

## 3. Get Privacy Policy

**Endpoint:** `GET /api/v1/privacy/policy`  
**Authorization:** Public (no auth required)  
**Purpose:** Get data retention policy and user rights information

### Response (200 OK)
```json
{
  "policyVersion": "1.0",
  "lastUpdated": "2026-02-03",
  "dataRetention": {
    "activeRecords": "As long as account is active",
    "deletedRecords": "Soft-deleted records retained for 90 days, then permanently deleted",
    "auditLogs": "Retained for 7 years for compliance purposes",
    "backups": "Encrypted backups retained for 30 days"
  },
  "userRights": [
    "Right to Access (GDPR Article 15) - Export your data",
    "Right to Rectification (GDPR Article 16) - Correct inaccurate data",
    "Right to Erasure (GDPR Article 17) - Delete your data",
    "Right to Data Portability (GDPR Article 20) - Receive data in structured format"
  ],
  "dataProcessingPurpose": "Human Resource Management, Payroll, and Attendance Tracking",
  "dataController": "UabIndia HRMS",
  "contactEmail": "privacy@uabindia.com"
}
```

### cURL Example
```bash
curl -X GET https://api.uabindia.com/api/v1/privacy/policy
```

---

## Health Check Endpoints

### 1. Comprehensive Health Check
**Endpoint:** `GET /health`  
**Authorization:** None  
**Purpose:** Check all system components (DB + API)

**Response:**
```json
{
  "status": "Healthy",
  "checks": [
    {
      "name": "database",
      "status": "Healthy",
      "description": null,
      "duration": 125.5
    },
    {
      "name": "self",
      "status": "Healthy",
      "description": null,
      "duration": 0.2
    }
  ],
  "totalDuration": 125.7
}
```

### 2. Liveness Probe
**Endpoint:** `GET /health/live`  
**Authorization:** None  
**Purpose:** Check if API process is running (Kubernetes liveness probe)

**Response:** `200 OK` if healthy, `503 Service Unavailable` if unhealthy

### 3. Readiness Probe
**Endpoint:** `GET /health/ready`  
**Authorization:** None  
**Purpose:** Check if DB is accessible (Kubernetes readiness probe)

**Response:** `200 OK` if database is accessible, `503 Service Unavailable` if not

---

## Testing with Postman

### Setup
1. Import endpoints into Postman
2. Set `{{baseUrl}}` variable to `http://localhost:5000` (dev) or production URL
3. Get admin JWT token from `/api/v1/auth/login`
4. Add token to Authorization header: `Bearer YOUR_JWT_TOKEN`

### Test Sequence
1. **Login as Admin:**
   ```
   POST /api/v1/auth/login
   Body: { "email": "admin@uabindia.in", "password": "Admin@123" }
   ```

2. **Get Privacy Policy (Public):**
   ```
   GET /api/v1/privacy/policy
   ```

3. **Export User Data:**
   ```
   POST /api/v1/privacy/export-user-data
   Body: { "userId": "<user-guid>" }
   Headers: Authorization: Bearer <token>
   ```

4. **Delete User:**
   ```
   POST /api/v1/privacy/delete-user
   Body: { "userId": "<user-guid>", "reason": "Testing GDPR deletion" }
   Headers: Authorization: Bearer <token>
   ```

5. **Health Checks:**
   ```
   GET /health
   GET /health/live
   GET /health/ready
   ```

---

## Compliance Notes

### Data Retention Schedule
| Data Type | Retention Period | Justification |
|-----------|------------------|---------------|
| Active User Data | Indefinite (while account active) | Operational requirement |
| Soft-Deleted Data | 90 days | Grace period for recovery |
| Audit Logs | 7 years | Legal/regulatory requirement |
| Backups | 30 days | Disaster recovery |

### GDPR Articles Implemented
- **Article 15:** Right of Access (export API)
- **Article 17:** Right to Erasure (delete API)
- **Article 20:** Right to Data Portability (JSON format)
- **Article 30:** Records of Processing (audit logs)

### Security Measures
- ✅ Admin-only access to privacy APIs
- ✅ Tenant isolation (users can only access their tenant's data)
- ✅ Audit trail for all deletions
- ✅ Safeguards against accidental deletion (system admin, self-deletion)
- ✅ Soft delete + anonymization (not hard delete)

---

## Support

For questions or issues:
- Technical Support: support@uabindia.com
- Privacy Inquiries: privacy@uabindia.com
- Security Issues: security@uabindia.com

---

**Last Updated:** February 3, 2026  
**API Version:** 1.0
