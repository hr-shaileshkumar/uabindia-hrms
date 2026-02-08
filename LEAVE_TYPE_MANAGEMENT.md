# Leave Type Management Feature - Implementation Summary

## Overview
Added a dynamic Leave Type management system where administrators can create and manage custom leave types. These leave types are then used when creating leave policies, making the system flexible and customizable.

## Changes Implemented

### Backend Changes

#### 1. New Entity: LeaveType
**File**: `Backend/src/UabIndia.Core/Entities/LeaveType.cs`
- `Code`: Short code (e.g., CL, SL, EL)
- `Name`: Full name (e.g., Casual Leave, Sick Leave)
- `Description`: Optional description
- `IsActive`: Active/Inactive status
- `DisplayOrder`: For sorting in UI
- Inherits from `BaseEntity` (multi-tenant support, soft delete, audit fields)

#### 2. DTOs Added
**File**: `Backend/src/UabIndia.Api/Models/LeaveDtos.cs`
- `CreateLeaveTypeDto`: For creating new leave types
- `LeaveTypeDto`: For returning leave type data

#### 3. API Endpoints
**File**: `Backend/src/UabIndia.Api/Controllers/LeaveController.cs`

**GET** `/api/v1/leave/types`
- Returns list of active leave types for current tenant
- Ordered by DisplayOrder and Name
- No admin restriction (readable by all HRMS module users)

**POST** `/api/v1/leave/types`
- Creates new leave type
- Requires `AdminOnly` authorization
- Request body: `CreateLeaveTypeDto`

#### 4. Database Context Updated
**File**: `Backend/src/UabIndia.Infrastructure/Data/ApplicationDbContext.cs`
- Added `DbSet<LeaveType> LeaveTypes`
- Added table mapping: `LeaveTypes`
- Added query filter for multi-tenant isolation

#### 5. Database Migration
**File**: `Backend/src/UabIndia.Infrastructure/Migrations/20260201180000_AddLeaveTypes.cs`

Creates `LeaveTypes` table with:
- Primary key on Id
- Unique index on TenantId + Code (prevents duplicate codes within tenant)
- All standard BaseEntity fields
- Default values for IsActive (true) and DisplayOrder (0)

### Frontend Changes

#### 1. API Client Updated
**File**: `frontend-next/src/lib/hrApi.ts`

Added leave types methods:
```typescript
leave: {
  types: {
    list: () => apiClient.get("/leave/types"),
    create: (data: any) => apiClient.post("/leave/types", data),
  },
  // ... existing policy, request, etc.
}
```

#### 2. Leave Management UI Enhanced
**File**: `frontend-next/src/app/(protected)/app/modules/hrms/leave/page.tsx`

**New Tab: Leave Types**
- Create leave type form with:
  - Code (required)
  - Name (required)
  - Description (optional)
  - Display Order
  - Is Active checkbox
- List of all leave types showing:
  - Name and code
  - Description
  - Active/Inactive badge

**Updated Leave Policy Form**
- Leave Type dropdown now populated from database
- Shows "Select Leave Type" placeholder
- Dynamically loads all active leave types
- No more hardcoded CL/SL/EL options

**State Management**
- `leaveTypes` state array
- `loadingTypes` loading state
- `leaveTypeForm` form state
- `fetchLeaveTypes()` function
- `handleCreateLeaveType()` function

## Usage Flow

### Admin: Creating Leave Types

1. Navigate to Leave Management → **Leave Types** tab
2. Fill in the form:
   - Code: `CL`
   - Name: `Casual Leave`
   - Description: `Used for personal work`
   - Display Order: `1`
   - Is Active: ✓
3. Click "Create Leave Type"
4. Leave type appears in the list

**Example Leave Types to Create:**
- **CL** - Casual Leave
- **SL** - Sick Leave
- **EL** - Earned Leave
- **PL** - Privilege Leave
- **ML** - Maternity Leave
- **PL** - Paternity Leave
- **LWP** - Leave Without Pay
- **CO** - Compensatory Off

### Admin: Creating Leave Policies

1. Navigate to **Leave Policies** tab
2. Select leave type from dropdown (populated from database)
3. Fill in policy details
4. Save policy

## Database Migration Instructions

### Apply Migration

**Option 1: After stopping the API**
```powershell
cd Backend
dotnet ef database update --project src\UabIndia.Infrastructure --startup-project src\UabIndia.Api
```

**Option 2: Manual SQL Execution**
```sql
CREATE TABLE LeaveTypes (
    Id uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
    Code nvarchar(50) NOT NULL,
    Name nvarchar(100) NOT NULL,
    Description nvarchar(500) NULL,
    IsActive bit NOT NULL DEFAULT 1,
    DisplayOrder int NOT NULL DEFAULT 0,
    TenantId uniqueidentifier NOT NULL,
    CreatedAt datetime2 NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy nvarchar(max) NULL,
    UpdatedAt datetime2 NULL,
    UpdatedBy nvarchar(max) NULL,
    IsDeleted bit NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IX_LeaveTypes_TenantId_Code 
ON LeaveTypes (TenantId, Code);
```

### Seed Default Leave Types (Optional)

```sql
-- Replace {YourTenantId} with actual tenant GUID
DECLARE @TenantId uniqueidentifier = '{YourTenantId}';

INSERT INTO LeaveTypes (Id, Code, Name, Description, IsActive, DisplayOrder, TenantId, CreatedAt, IsDeleted)
VALUES
(NEWID(), 'CL', 'Casual Leave', 'For personal work or unforeseen circumstances', 1, 1, @TenantId, GETUTCDATE(), 0),
(NEWID(), 'SL', 'Sick Leave', 'For medical reasons and health issues', 1, 2, @TenantId, GETUTCDATE(), 0),
(NEWID(), 'EL', 'Earned Leave', 'Privilege leave earned through service', 1, 3, @TenantId, GETUTCDATE(), 0),
(NEWID(), 'PL', 'Privilege Leave', 'Earned privilege leave for vacation', 1, 4, @TenantId, GETUTCDATE(), 0),
(NEWID(), 'ML', 'Maternity Leave', 'For maternity purposes', 1, 5, @TenantId, GETUTCDATE(), 0),
(NEWID(), 'PtL', 'Paternity Leave', 'For paternity purposes', 1, 6, @TenantId, GETUTCDATE(), 0),
(NEWID(), 'LWP', 'Leave Without Pay', 'Unpaid leave', 1, 7, @TenantId, GETUTCDATE(), 0),
(NEWID(), 'CO', 'Compensatory Off', 'Comp off for working on holidays', 1, 8, @TenantId, GETUTCDATE(), 0);
```

## Benefits

### 1. Flexibility
- Organizations can define their own leave types
- No code changes needed to add new leave types
- Easy to activate/deactivate leave types

### 2. Customization
- Custom codes and names per organization
- Display order control for UI presentation
- Detailed descriptions for clarity

### 3. Multi-Tenant Support
- Each tenant has their own leave types
- Isolated data with query filters
- Unique code constraint per tenant

### 4. Better UX
- Dropdown auto-populated with active types
- Sorted by display order for logical presentation
- Clear naming instead of cryptic codes

### 5. Audit Trail
- Created/Updated timestamps
- Created/Updated by user tracking
- Soft delete support

## Validation Rules

### Backend Validations
- Code: Required, max 50 characters
- Name: Required, max 100 characters
- Description: Optional, max 500 characters
- Code must be unique per tenant

### Frontend Validations
- Code and Name are required fields
- Form clears after successful creation
- Error messages displayed for failures

## Security

- **Read Access**: All HRMS module users
- **Create/Update Access**: Admin only
- **Tenant Isolation**: Enforced via query filters
- **Soft Delete**: Maintains data integrity

## Testing Checklist

- [ ] Database migration applies successfully
- [ ] LeaveTypes table created with correct schema
- [ ] Unique index on TenantId + Code works
- [ ] GET /leave/types returns empty array initially
- [ ] POST /leave/types creates leave type successfully
- [ ] Duplicate code for same tenant is rejected
- [ ] Leave Types tab loads in frontend
- [ ] Create leave type form submits correctly
- [ ] Leave type dropdown in policy form shows dynamic data
- [ ] Only active leave types appear in dropdown
- [ ] Display order affects sorting in dropdown
- [ ] Admin authorization enforced on POST endpoint

## Future Enhancements

1. **Edit Leave Types**: Add update functionality
2. **Delete/Deactivate**: Soft delete or deactivate leave types
3. **Leave Type Rules**: Associate specific rules with leave types
4. **Import/Export**: Bulk import from CSV/Excel
5. **Leave Type Categories**: Group related leave types
6. **Usage Analytics**: Track which leave types are most used
7. **Validation Rules**: Add min/max days constraints per leave type

## Rollback Plan

If migration needs to be reverted:

```sql
DROP INDEX IX_LeaveTypes_TenantId_Code ON LeaveTypes;
DROP TABLE LeaveTypes;
```

Then remove the migration file and revert code changes.
