# 🔧 API Integration Troubleshooting Guide

**Status**: API Client Updated ✅  
**Backend**: Running on `http://localhost:5000` ✅  
**Frontend**: Running on `http://localhost:3000` ✅  
**API Rewrites**: Configured in `next.config.ts` ✅

---

## 📊 Current Issue Status

### ✅ FIXED
- **404 Errors on API calls** → Fixed by updating `src/lib/hrApi.ts` to use actual backend endpoints
- **API Base URL** → Correctly configured via Next.js rewrites in `next.config.ts`

### 🔄 IN PROGRESS
- **Missing Test User** → Backend API is responding but test login fails with "Invalid credentials"
- **Mock Endpoints** → Using mock data for `/companies`, `/projects`, `/system/version` until backend implements

---

## 🎯 Actual Backend API Endpoints

The .NET backend provides these endpoints (verified February 1, 2026):

### Authentication
- ✅ `POST /api/v1/auth/login` - Login with email/password/deviceId
- ✅ `POST /api/v1/auth/refresh` - Refresh expired access token  
- ✅ `GET /api/v1/auth/me` - Get current user (requires Authorization header)
- ✅ `POST /api/v1/auth/logout` - Logout and revoke refresh tokens

### Modules
- ✅ `GET /api/v1/modules/enabled` - Get enabled modules for current user (requires Authorization)

### Employees (HRMS)
- ✅ `GET /api/v1/employees` - List employees
- ✅ `POST /api/v1/employees` - Create employee
- ✅ `GET /api/v1/employees/{id}` - Get employee details
- ✅ `PUT /api/v1/employees/{id}` - Update employee

### Attendance (HRMS)
- ✅ `GET /api/v1/attendance` - List attendance records
- ✅ `POST /api/v1/attendance/punch` - Mark attendance (clock in/out)

### Leave (HRMS)
- ✅ `GET /api/v1/leave/requests` - List leave requests
- ✅ `POST /api/v1/leave/requests` - Request leave
- ✅ `POST /api/v1/leave/requests/{id}/approve` - Approve leave request
- ✅ `GET /api/v1/leave/policies` - Get leave policies

### Payroll (HRMS)
- ✅ `GET /api/v1/payroll/payslips` - List payslips
- ✅ `GET /api/v1/payroll/runs` - List payroll runs
- ✅ `POST /api/v1/payroll/runs` - Create payroll run

### Dashboard
- ✅ `GET /api/v1/hr/dashboard` - Get HRMS dashboard stats

### ❌ NOT YET IMPLEMENTED
- ❌ `GET /api/v1/companies` - Get company list (using MOCK data)
- ❌ `GET /api/v1/projects` - Get projects (using MOCK data)  
- ❌ `GET /api/v1/system/version` - Get app version (using MOCK data)

---

## 🚀 Next Steps to Get Frontend Working

### Step 1: Create Test User in Backend Database

The backend needs a test user to authenticate. Choose one:

**Option A: Add user via backend code/seed** (if you have database access)
```sql
INSERT INTO Users (Id, TenantId, Email, FullName, PasswordHash, IsActive, IsDeleted, CreatedAt)
VALUES (
  NEWID(),
  (SELECT TOP 1 Id FROM Tenants),
  'test@example.com',
  'Test User',
  'hashed_password_here',
  1,
  0,
  GETUTCDATE()
);
```

**Option B: Implement a seed endpoint in backend**
```csharp
// Add to AuthController
[HttpPost("seed-test-user")]
[AllowAnonymous]
public async Task<IActionResult> SeedTestUser()
{
  var hasher = new PasswordHasher<User>();
  var testUser = new User {
    Email = "test@example.com",
    FullName = "Test User",
    IsActive = true,
    TenantId = tenantId
  };
  testUser.PasswordHash = hasher.HashPassword(testUser, "password123");
  
  _db.Users.Add(testUser);
  await _db.SaveChangesAsync();
  
  return Ok(new { message = "Test user created" });
}
```

**Option C: Use existing user credentials** (if admin user already created)
Check backend logs or documentation for existing test account

### Step 2: Update Frontend with Credentials

Once you have credentials, in development you can:

1. Edit [src/app/(auth)/Login.tsx](src/app/(auth)/Login.tsx) to pre-fill test credentials:
```tsx
const [email, setEmail] = useState("test@example.com");
const [password, setPassword] = useState("password123");
```

2. Or update login flow to show debug credentials in development mode

### Step 3: Test Full Authentication Flow

1. Start frontend: `npm run dev`
2. Navigate to `http://localhost:3000/login`
3. Enter test credentials and login
4. Verify:
   - ✅ Login successful, redirects to `/app/hrms`
   - ✅ Topbar shows user name
   - ✅ Sidebar loads with modules
   - ✅ Dashboard loads with stats from `/api/v1/hr/dashboard`
   - ✅ Employee list loads from `/api/v1/employees`

---

## 🔍 Debugging API Calls

### Check Network Tab in DevTools
1. Open DevTools (F12)
2. Go to **Network** tab
3. Reload page
4. Look for requests to `/api/v1/*`
5. Verify:
   - Status code (should be 200, not 404)
   - Request headers include `Authorization: Bearer {token}`
   - Response body has expected data shape

### Test Endpoints with Curl

**Test Modules (requires valid JWT)**:
```bash
# First, get a valid token by logging in
$token = "your_access_token_here"

# Then test modules endpoint
curl -X GET "http://localhost:5000/api/v1/modules/enabled" `
  -H "Authorization: Bearer $token"
```

**Test Employees**:
```bash
curl -X GET "http://localhost:5000/api/v1/employees" `
  -H "Authorization: Bearer $token"
```

**Test HR Dashboard**:
```bash
curl -X GET "http://localhost:5000/api/v1/hr/dashboard" `
  -H "Authorization: Bearer $token"
```

### Check Browser Console

Look for errors like:
- `404 Not Found` - Endpoint doesn't exist (verify endpoint name)
- `401 Unauthorized` - Token missing or invalid (check localStorage)
- `403 Forbidden` - User doesn't have permission (check RBAC policy)
- `500 Internal Server Error` - Backend error (check backend logs)

---

## 📝 Backend API Contract Changes

The frontend was updated to match the actual backend. Here's what changed:

| Feature | Original Endpoint | Actual Endpoint | Status |
|---------|------------------|-----------------|--------|
| Dashboard | `/api/v1/dashboard/stats` | `/api/v1/hr/dashboard` | ✅ Fixed |
| Employees | `/api/v1/hrms/employees` | `/api/v1/employees` | ✅ Fixed |
| Attendance | `/api/v1/hrms/attendance` | `/api/v1/attendance` | ✅ Fixed |
| Leave | `/api/v1/hrms/leave` | `/api/v1/leave/requests` | ✅ Fixed |
| Payroll | `/api/v1/hrms/payroll` | `/api/v1/payroll/payslips` | ✅ Fixed |
| Companies | `/api/v1/companies` | 🔄 MOCKED | ⏳ Pending |
| Projects | `/api/v1/projects` | 🔄 MOCKED | ⏳ Pending |
| Version | `/api/v1/system/version` | 🔄 MOCKED | ⏳ Pending |

---

## 🛠️ Modified Files

Updated to work with actual backend endpoints:

1. **`src/lib/hrApi.ts`** (90 lines)
   - Changed `/dashboard/stats` → `/hr/dashboard`
   - Changed `/hrms/employees` → `/employees`
   - Changed `/hrms/attendance` → `/attendance`
   - Changed `/hrms/leave` → `/leave/requests`
   - Changed `/hrms/payroll` → `/payroll/payslips`
   - Mocked `/companies`, `/projects`, `/system/version` endpoints

2. **`src/components/Topbar.tsx`** (Partial update)
   - Updated company/project fetch to use mock data with proper type casting

---

## ✅ Verification Checklist

Before declaring "API integration complete":

- [ ] Backend is running on port 5000
- [ ] Frontend can reach backend via `/api/v1/*` rewrites
- [ ] Test user exists in backend database
- [ ] Login endpoint returns valid JWT token
- [ ] `/api/v1/auth/me` returns user details with valid token
- [ ] `/api/v1/modules/enabled` returns module list
- [ ] `/api/v1/hr/dashboard` returns dashboard stats
- [ ] `/api/v1/employees` returns employee list
- [ ] Frontend login page successfully authenticates
- [ ] Frontend redirects to dashboard after login
- [ ] Sidebar loads with actual modules from backend
- [ ] Employee list page loads with real data
- [ ] No 404 errors in browser console

---

## 🔗 Related Documentation

- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Full backend requirements
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design and API client structure
- **[README_FINAL.md](./README_FINAL.md)** - Getting started guide

---

## 📞 Common Issues & Solutions

### Issue: "Request failed with status code 404"
**Cause**: Endpoint doesn't exist in backend  
**Solution**: 
1. Verify endpoint name in `src/lib/hrApi.ts` matches backend controller
2. Check backend `*Controller.cs` files for actual routes
3. Ensure authorization policies are met (`[Authorize(Policy = "Module:hrms")]`)

### Issue: "Request failed with status code 401"
**Cause**: Missing or invalid Authorization token  
**Solution**:
1. Verify token is stored in localStorage after login
2. Check DevTools → Application → LocalStorage for `access_token`
3. Ensure token is attached to request headers
4. Test with valid JWT at https://jwt.io

### Issue: "Cannot find companies to populate dropdown"
**Cause**: Backend doesn't implement `/api/v1/companies` yet  
**Solution**:
1. Using MOCK data for now (see `src/lib/hrApi.ts`)
2. Implement endpoint in backend when ready
3. Frontend will automatically use real data once available

### Issue: "No test user for login"
**Cause**: Backend database has no user records  
**Solution**:
1. Add test user to database (see "Step 1" above)
2. Or create seed endpoint in backend  
3. Or use existing admin credentials

---

**Last Updated**: February 1, 2026  
**Status**: ✅ API client aligned with actual backend  
**Next**: Create test user and verify full login flow
