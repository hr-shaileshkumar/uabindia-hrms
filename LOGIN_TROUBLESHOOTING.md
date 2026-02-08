# Login Troubleshooting Guide

**Date:** February 3, 2026  
**Purpose:** Diagnose and fix login failures

---

## 🔍 Issues Found & Analysis

### Issue 1: Request Payload Format Mismatch ⚠️

**Location:** [frontend-next/src/app/(auth)/login/page.tsx](frontend-next/src/app/(auth)/login/page.tsx) line 35-40

**Problem:**
Frontend is sending: `{ Email: userId, Password: password, DeviceId: deviceId }`
Backend expects: `{ email, password, deviceId }` (case-sensitive JSON deserialization)

**Impact:** The backend's LoginRequest model receives `null` values due to property name mismatch.

**Frontend Code:**
```typescript
const res = await apiClient.post("/auth/login", {
  Email: userId,           // ❌ Should be lowercase 'email'
  Password: password,      // ❌ Should be lowercase 'password'
  DeviceId: deviceId,      // ❌ Should be lowercase 'deviceId'
});
```

**Backend Model:**
```csharp
public class LoginRequest { 
  public string? Email { get; set; }      // Expects 'Email' OR 'email'
  public string? Password { get; set; }   // Expects 'Password' OR 'password'
  [Required] public string? DeviceId { get; set; }  // Expects 'DeviceId' OR 'deviceId'
}
```

**Why it fails:**
By default, .NET's JSON deserializer is **case-sensitive**. It looks for exact property name matches.

---

### Issue 2: API Connection

**Location:** [next.config.ts](frontend-next/next.config.ts)

**Current Config:**
```typescript
destination: "https://api.uabindia.in/api/:path*",
```

**Status:** ⏳ API server not deployed yet
- `https://api.uabindia.in` is not reachable
- Returns connection timeout

**Solution:** Deploy backend to api.uabindia.in or use local backend for testing

---

## ✅ Solutions

### Solution A: Fix Frontend Property Names (Recommended)

Update [frontend-next/src/app/(auth)/login/page.tsx](frontend-next/src/app/(auth)/login/page.tsx):

```typescript
// CHANGE FROM:
const res = await apiClient.post("/auth/login", {
  Email: userId,
  Password: password,
  DeviceId: deviceId,
});

// CHANGE TO:
const res = await apiClient.post("/auth/login", {
  email: userId,           // ✅ lowercase
  password: password,      // ✅ lowercase
  deviceId: deviceId,      // ✅ lowercase
});
```

---

### Solution B: Make Backend Case-Insensitive (Alternative)

Update [Backend/src/UabIndia.Api/Program.cs](Backend/src/UabIndia.Api/Program.cs):

```csharp
// ADD this configuration
services.Configure<JsonSerializerOptions>(options =>
{
    options.PropertyNameCaseInsensitive = true;
});

// OR in Startup:
services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });
```

---

### Solution C: Test with Local Backend

**Step 1: Start Backend**
```bash
cd c:\Users\hp\Desktop\HRMS\Backend\src\UabIndia.Api
dotnet run
```

**Step 2: Update Frontend Config** (temporarily)

Edit [frontend-next/next.config.ts](frontend-next/next.config.ts):
```typescript
destination: "http://localhost:5000/api/:path*",  // Local backend
```

**Step 3: Start Frontend**
```bash
cd c:\Users\hp\Desktop\HRMS\frontend-next
npm run dev
```

**Step 4: Test Login**
- Navigate to http://localhost:3000/login
- Try default credentials (check backend for seeded users)
- Monitor console for errors

---

## 🧪 Testing Checklist

### Before Testing
- [ ] Backend API is running (local or remote)
- [ ] Frontend can reach the API
- [ ] Test user account exists in database

### Login Test Steps
- [ ] Open login page
- [ ] Check browser console (F12) for errors
- [ ] Check Network tab for API requests
- [ ] Verify request JSON format
- [ ] Check response status code (should be 200 on success)
- [ ] Verify access_token is returned

### Debugging
```bash
# Check if backend is running
curl http://localhost:5000/health

# Check API endpoint
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Password123",
    "deviceId": "test-device"
  }'

# Expected response (200):
{
  "access_token": "eyJhbGci...",
  "refresh_token": "...",
  "expires_in": 900
}

# On error (401):
{
  "message": "Invalid credentials"
}
```

---

## 📋 Step-by-Step Fix

### Quick Fix (3 minutes)

**Step 1:** Edit frontend login page
```bash
# File: c:\Users\hp\Desktop\HRMS\frontend-next\src\app\(auth)\login\page.tsx
# Line 35-40: Change property names to lowercase
```

**Step 2:** Start services (local testing)
```bash
# Terminal 1: Backend
cd c:\Users\hp\Desktop\HRMS\Backend\src\UabIndia.Api
dotnet run

# Terminal 2: Frontend  
cd c:\Users\hp\Desktop\HRMS\frontend-next
npm run dev
```

**Step 3:** Test login
- Go to http://localhost:3000/login
- Try credentials
- Check if login works

---

## 🔐 Common Login Issues & Solutions

| Issue | Cause | Fix |
|-------|-------|-----|
| "Invalid credentials" (401) | User not found or wrong password | Check user exists, verify password |
| "Invalid request body" (400) | Property name mismatch or missing required field | Use lowercase property names |
| "DeviceId is required" (400) | DeviceId not sent or null | Ensure getDeviceId() returns valid value |
| CORS error | Frontend domain not in backend CORS allow-list | Add frontend domain to backend CORS config |
| "Network Error" or timeout | API server not reachable | Deploy API or test with local backend |
| Token not saved | localStorage issue | Clear browser cache, check cookie settings |

---

## 🚀 Recommended Action Plan

**Immediate (Now):**
1. Fix frontend property names (email, password, deviceId - lowercase)
2. Test with local backend (localhost:5000)
3. Verify login works locally

**Short-term (Today):**
1. Deploy backend to api.uabindia.in
2. Configure DNS
3. Update frontend config to use production API
4. Test end-to-end login

**Ongoing:**
1. Monitor login errors in Application Insights
2. Add better error messages to frontend
3. Implement login retry logic
4. Set up login monitoring/alerting

---

## Configuration Files to Review

1. **Frontend Login:** [frontend-next/src/app/(auth)/login/page.tsx](frontend-next/src/app/(auth)/login/page.tsx)
   - Line 11: Password state
   - Line 35-40: Login API request
   - Line 45-51: Response handling

2. **Backend Auth:** [Backend/src/UabIndia.Api/Controllers/AuthController.cs](Backend/src/UabIndia.Api/Controllers/AuthController.cs)
   - Line 41+: Login endpoint
   - Line 270: LoginRequest model

3. **API Client:** [frontend-next/src/lib/apiClient.ts](frontend-next/src/lib/apiClient.ts)
   - Line 10: Base URL configuration
   - Line 41-50: Request interceptors

4. **Next Config:** [frontend-next/next.config.ts](frontend-next/next.config.ts)
   - Line 7-13: API proxy configuration

---

## Next Steps

1. **Fix the property name issue** in frontend login
2. **Test with local backend** to verify the fix
3. **Deploy backend** to api.uabindia.in when ready
4. **Test production flow** end-to-end
5. **Monitor errors** in Application Insights

---

**Status:** ⚠️ Login issue identified - property name case mismatch  
**Severity:** Medium (affects all login attempts)  
**Fix Time:** ~5 minutes  
**Testing Time:** ~10 minutes
