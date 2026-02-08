# 🧪 Testing Login - Live Session

**Date:** February 3, 2026  
**Status:** ✅ BOTH SERVICES RUNNING

---

## Services Running

### Backend API
- **URL:** http://localhost:5000
- **Status:** ✅ Running
- **Started:** Just now
- **Port:** 5000

### Frontend UI
- **URL:** http://localhost:3000
- **Status:** ✅ Running
- **Started:** Just now
- **Port:** 3000
- **Config:** Points to localhost:5000

---

## Test Login NOW

### Step 1: Open Browser
```
http://localhost:3000/login
```

### Step 2: Enter Credentials
```
Email:    admin@uabindia.in
Password: Admin@123456
```

### Step 3: Click Login

### Expected Result (Success)
- ✅ Page redirects to dashboard
- ✅ URL changes to `http://localhost:3000/app/hrms` or similar
- ✅ Can see dashboard content
- ✅ No error messages

---

## Verify the Fix (Browser DevTools)

**Press F12 → Network Tab → Login Request → Headers**

**Request should show:**
```json
{
  "email": "admin@uabindia.in",
  "password": "Admin@123456",
  "deviceId": "device-123"
}
```

**✅ Correct:** All lowercase property names  
**❌ Wrong:** Would be "Email", "Password", "DeviceId" (uppercase)

---

## Check Backend Response

**In Network Tab → Response:**
```json
{
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 3600
  }
}
```

---

## Check Stored Token

**Browser Console (F12 → Console):**
```javascript
// Run this command:
localStorage.getItem('access_token')

// Should return a long JWT token starting with "eyJ..."
```

---

## Backend Console Logs (Success Indicators)

Watch the terminal where `dotnet run` is running. You should see:

```
info: Microsoft.AspNetCore.Hosting.Diagnostics[2]
      Request finished HTTP/1.1 POST /api/v1/auth/login 200 ...

dbug: UabIndia.Api.Controllers.AuthController[0]
      User 'admin@uabindia.in' logged in successfully

info: Microsoft.AspNetCore.Hosting.Diagnostics[16]
      Request reached end of middleware pipeline with status code 200
```

---

## Troubleshooting

### ❌ "Cannot reach localhost:3000"
- Frontend didn't start
- Run: `cd frontend-next && npm run dev`

### ❌ "Cannot reach localhost:5000" 
- Backend didn't start or crashed
- Run: `cd Backend/src/UabIndia.Api && dotnet run`

### ❌ "Login failed" / 400 error
- Backend rejecting request
- Check backend console for error message
- Verify email/password are correct

### ❌ "Network error" after login
- API rewrites not working
- Verify `next.config.ts` points to `http://localhost:5000`

### ❌ "Token not saved"
- Check browser localStorage
- Run in console: `localStorage.getItem('access_token')`

---

## What the Fix Changed

**Before (Broken):**
```typescript
// frontend-next/src/app/(auth)/login/page.tsx (lines 39-42)
apiClient.post("/auth/login", {
  Email: userId,           // ❌ UPPERCASE
  Password: password,      // ❌ UPPERCASE
  DeviceId: deviceId,      // ❌ UPPERCASE
});
```

**After (Fixed):**
```typescript
// frontend-next/src/app/(auth)/login/page.tsx (lines 39-42)
apiClient.post("/auth/login", {
  email: userId,           // ✅ lowercase
  password: password,      // ✅ lowercase
  deviceId: deviceId,      // ✅ lowercase
});
```

**Why it matters:**
- .NET JSON deserializer is case-sensitive
- Backend LoginRequest expects lowercase properties
- Frontend was sending uppercase → backend couldn't deserialize → null values → validation failed

---

## Success Indicators

| Item | Status | Evidence |
|------|--------|----------|
| Backend running | ✅ | Terminal shows "Now listening on http://localhost:5000" |
| Frontend running | ✅ | Terminal shows "Ready in 986ms" at http://localhost:3000 |
| API proxy configured | ✅ | next.config.ts points to localhost:5000 |
| Login fix applied | ✅ | Frontend sends lowercase JSON properties |
| Ready to test | ✅ | Both services running, fix applied |

---

## Commands Reference

**Stop all services:**
```bash
# Ctrl+C in each terminal
```

**Restart backend:**
```bash
cd Backend/src/UabIndia.Api
dotnet run
```

**Restart frontend:**
```bash
cd frontend-next
npm run dev
```

**Check if ports are in use:**
```powershell
netstat -ano | findstr :5000    # Backend
netstat -ano | findstr :3000    # Frontend
```

---

## Next Steps After Testing

1. ✅ **Test login locally** ← YOU ARE HERE
2. 📝 Document results
3. 🚀 Deploy backend to api.uabindia.in
4. 🌐 Update frontend to point to production API
5. ✅ Test production login
6. 📊 Monitor Application Insights

---

**Status:** Ready to test!  
**Next:** Open http://localhost:3000/login and try logging in  
**Timeline:** 2-5 minutes to verify login works

