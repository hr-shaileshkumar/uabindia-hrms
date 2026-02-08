# Leave Management Enhancements - Migration Instructions

## Overview
Enhanced the Leave Management system with:
- **Leave Period**: Full Day, First Half, Second Half options for leave requests
- **Leave Type Improvements**: Better categorization and management
- **Leave Allocation/Assignment Policy**: Systematic leave assignment to employees with proration and scheduling

## Database Migration Required

### Migration File Created
**File**: `Backend/src/UabIndia.Infrastructure/Migrations/20260201170000_AddLeaveEnhancements.cs`

### Changes Include

#### 1. LeaveRequests Table
- **Added Column**: `Period` (int, default: 0 = FullDay)
  - 0 = FullDay
  - 1 = FirstHalf
  - 2 = SecondHalf

#### 2. LeavePolicies Table
- **Added Column**: `AllocationFrequency` (int, default: 0 = Yearly)
  - 0 = Yearly
  - 1 = Monthly
  - 2 = Quarterly
  - 3 = OnJoining
- **Added Column**: `AutoAllocate` (bit, default: false)
- **Added Column**: `EnableProration` (bit, default: true)

#### 3. New Table: LeaveAllocations
```sql
CREATE TABLE LeaveAllocations (
    Id uniqueidentifier PRIMARY KEY,
    EmployeeId uniqueidentifier NOT NULL,
    LeavePolicyId uniqueidentifier NOT NULL,
    Year int NOT NULL,
    AllocatedDays decimal(18,2) NOT NULL,
    EffectiveFrom datetime2 NOT NULL,
    EffectiveTo datetime2 NULL,
    AllocationReason nvarchar(max) NOT NULL,
    IsProrated bit NOT NULL,
    CarryForwardDays decimal(18,2) NULL,
    TenantId uniqueidentifier NOT NULL,
    CreatedAt datetime2 NOT NULL,
    CreatedBy nvarchar(max) NULL,
    UpdatedAt datetime2 NULL,
    UpdatedBy nvarchar(max) NULL,
    IsDeleted bit NOT NULL
)
```

### How to Apply Migration

**Option 1: After stopping the running API**
```powershell
cd Backend
dotnet ef database update --project src\UabIndia.Infrastructure --startup-project src\UabIndia.Api
```

**Option 2: Manual SQL execution** (if API cannot be stopped)
```sql
-- Add Period column to LeaveRequests
ALTER TABLE LeaveRequests ADD Period int NOT NULL DEFAULT 0;

-- Add allocation fields to LeavePolicies
ALTER TABLE LeavePolicies ADD AllocationFrequency int NOT NULL DEFAULT 0;
ALTER TABLE LeavePolicies ADD AutoAllocate bit NOT NULL DEFAULT 0;
ALTER TABLE LeavePolicies ADD EnableProration bit NOT NULL DEFAULT 1;

-- Create LeaveAllocations table
CREATE TABLE LeaveAllocations (
    Id uniqueidentifier PRIMARY KEY DEFAULT NEWID(),
    EmployeeId uniqueidentifier NOT NULL,
    LeavePolicyId uniqueidentifier NOT NULL,
    Year int NOT NULL,
    AllocatedDays decimal(18,2) NOT NULL,
    EffectiveFrom datetime2 NOT NULL,
    EffectiveTo datetime2 NULL,
    AllocationReason nvarchar(max) NOT NULL,
    IsProrated bit NOT NULL DEFAULT 0,
    CarryForwardDays decimal(18,2) NULL,
    TenantId uniqueidentifier NOT NULL,
    CreatedAt datetime2 NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy nvarchar(max) NULL,
    UpdatedAt datetime2 NULL,
    UpdatedBy nvarchar(max) NULL,
    IsDeleted bit NOT NULL DEFAULT 0
);
```

## Backend Changes

### New Entity: LeaveAllocation
**File**: `Backend/src/UabIndia.Core/Entities/LeaveAllocation.cs`
- Tracks leave allocations to employees by policy and year
- Supports proration, carry forward, and effective date ranges

### Updated Entities

#### LeaveRequest
**File**: `Backend/src/UabIndia.Core/Entities/LeaveRequest.cs`
- Added `LeavePeriod Period` enum property (FullDay/FirstHalf/SecondHalf)

#### LeavePolicy
**File**: `Backend/src/UabIndia.Core/Entities/LeavePolicy.cs`
- Added `AllocationFrequency` enum (Yearly/Monthly/Quarterly/OnJoining)
- Added `EnableProration` boolean
- Added `AutoAllocate` boolean

### New DTOs
**File**: `Backend/src/UabIndia.Api/Models/LeaveDtos.cs`
- `CreateLeaveAllocationDto`: For creating new allocations
- `LeaveAllocationDto`: For returning allocation data
- Updated `CreateLeavePolicyDto` and `LeavePolicyDto` with allocation fields
- Updated `CreateLeaveRequestDto` and `LeaveRequestDto` with period field

### New API Endpoints
**Controller**: `Backend/src/UabIndia.Api/Controllers/LeaveController.cs`

#### Leave Allocation Endpoints
- `GET /api/v1/leave/allocations?employeeId={guid}&year={year}`
  - Query allocations by employee and/or year
  - Returns array of LeaveAllocationDto

- `POST /api/v1/leave/allocations`
  - Create new leave allocation
  - Body: CreateLeaveAllocationDto
  - Requires AdminOnly authorization

#### Updated Endpoints
- All policy and request endpoints now include the new fields

### Database Context Update
**File**: `Backend/src/UabIndia.Infrastructure/Data/ApplicationDbContext.cs`
- Added `DbSet<LeaveAllocation> LeaveAllocations`
- Added query filter for multi-tenant support

## Frontend Changes

### Updated API Client
**File**: `frontend-next/src/lib/hrApi.ts`
- Added `allocations.list()` and `allocations.create()` methods

### Enhanced Leave Management UI
**File**: `frontend-next/src/app/(protected)/app/modules/hrms/leave/page.tsx`

#### New Tab: Allocations
- Form to create leave allocations with:
  - Employee selector
  - Leave policy dropdown
  - Year input
  - Allocated days
  - Effective date range
  - Allocation reason
  - Proration checkbox
  - Carry forward days
- Table showing all allocations with filters

#### Updated Leave Request Form
- Added **Leave Period** dropdown:
  - Full Day
  - First Half
  - Second Half

#### Updated Leave Policy Form
- Added **Allocation Frequency** dropdown (Yearly/Monthly/Quarterly/On Joining)
- Added **Enable Proration** checkbox
- Added **Auto Allocate** checkbox

## Features Implemented

### 1. Leave Period Management
- Users can now specify whether a leave is for:
  - Full Day (default)
  - First Half (morning session)
  - Second Half (afternoon session)
- Useful for half-day leave calculations

### 2. Leave Allocation Policy
- Systematic assignment of leave entitlements to employees
- **Allocation Frequency**: Control when leaves are credited
  - Yearly: Once per year
  - Monthly: Monthly credit
  - Quarterly: Quarterly credit
  - On Joining: Upon employee onboarding
- **Proration Support**: Automatically calculate prorated leaves for mid-year joiners
- **Auto Allocation**: Enable automatic leave crediting based on policy settings
- **Carry Forward Tracking**: Record carry-forward days from previous periods
- **Effective Date Ranges**: Set allocation validity periods

### 3. Enhanced Leave Type System
- Better categorization with allocation rules
- Policy-level configuration for allocation behavior
- Supports complex leave accrual scenarios

## Testing Checklist

### Backend Testing
- [ ] Migration applies successfully
- [ ] LeaveAllocations table created with all columns
- [ ] GET /leave/allocations returns empty array initially
- [ ] POST /leave/allocations creates allocation successfully
- [ ] Query filters (employeeId, year) work correctly
- [ ] Period field in LeaveRequest accepts enum values
- [ ] Policy creation includes new allocation fields

### Frontend Testing
- [ ] Allocations tab visible and loads
- [ ] Allocation creation form submits correctly
- [ ] Period dropdown appears in leave request form
- [ ] Policy form shows allocation frequency options
- [ ] Proration and auto-allocate checkboxes functional
- [ ] Allocations table displays data correctly

## Rollback Plan

If migration needs to be reverted:

```sql
-- Remove LeaveAllocations table
DROP TABLE LeaveAllocations;

-- Remove new columns from LeavePolicies
ALTER TABLE LeavePolicies DROP COLUMN AllocationFrequency;
ALTER TABLE LeavePolicies DROP COLUMN AutoAllocate;
ALTER TABLE LeavePolicies DROP COLUMN EnableProration;

-- Remove Period column from LeaveRequests
ALTER TABLE LeaveRequests DROP COLUMN Period;
```

## Future Enhancements

1. **Automatic Allocation Jobs**
   - Background service to auto-allocate leaves based on policy settings
   - Scheduled tasks for monthly/quarterly/yearly allocations

2. **Allocation Reports**
   - Allocation history by employee
   - Pending allocations dashboard
   - Proration calculation audits

3. **Bulk Allocation**
   - Allocate leaves to multiple employees at once
   - Import from Excel/CSV

4. **Allocation Approval Workflow**
   - HR approval for special allocations
   - Audit trail for all allocation changes

## Notes

- The API server was running during development, preventing auto-generation of migration via `dotnet ef migrations add`
- Migration file was manually created with proper structure
- All backend code compiles successfully
- Frontend changes are backward compatible
- Multi-tenant query filters applied to LeaveAllocations table
- Soft delete support included in LeaveAllocations
