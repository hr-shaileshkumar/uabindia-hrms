# Login Testing Guide

**Date:** February 3, 2026  
**Status:** Ready to test after login fix applied

---

## Quick Test (5 minutes)

### Prerequisites
- Backend running: `dotnet run` from Backend\src\UabIndia.Api
- Frontend running: `npm run dev` from frontend-next
- Test user credentials ready

### Test Steps

**1. Open Login Page**
```
http://localhost:3000/login
```

**2. Enter Credentials**
- User ID/Email: Find a valid user from backend (check Users table)
  - Example: `admin@uabindia.com` or first user's email
- Password: The user's actual password
  - Example: `Password123` (or whatever was set during seeding)

**3. Submit Form**
- Click "Sign in" button
- Wait for 2-3 seconds for API response

**4. Expected Result**
- ✅ Success: Redirected to `/app/modules/hrms` (dashboard)
- ❌ Failure: Error message appears or stuck on login page

---

## Debugging Failed Login

### If Login Fails - Check These

#### Browser Console (F12 → Console Tab)
Look for error messages like:
```javascript
// Good: No errors or just network requests
GET /api/v1/auth/me 200

// Bad: Error shown
Error: Invalid request body
Error: CORS error
Error: Network timeout
```

#### Network Tab (F12 → Network Tab)
1. Click login button
2. Find `login` request in Network tab (red triangle = failed)
3. Click on it → Response tab
4. See what error the backend returned:
   - 400: Validation error (check request format)
   - 401: Invalid credentials (wrong email/password)
   - 500: Server error (check backend logs)

#### Backend Logs
Watch the backend terminal for error messages:
```
[ERR] LoginRequest validation failed...
[ERR] User not found...
[ERR] Password verification failed...
```

---

## Complete Test Scenario

### Test 1: Valid Credentials
**Objective:** Verify login works with correct credentials

**Steps:**
1. Go to http://localhost:3000/login
2. Enter valid email and password
3. Click "Sign in"
4. Wait for redirect

**Expected Result:** ✅ Redirected to dashboard

**If Failed:**
- Check if user exists in database
- Verify password is correct
- Check browser console for errors
- Check backend logs for details

---

### Test 2: Invalid Email
**Objective:** Verify proper error handling for non-existent user

**Steps:**
1. Go to http://localhost:3000/login
2. Enter: `nonexistent@uabindia.com`
3. Enter: `anything`
4. Click "Sign in"

**Expected Result:** ✅ Error message: "Invalid credentials"

**If Failed:**
- Check backend is returning proper error response
- Should be 401 Unauthorized

---

### Test 3: Invalid Password
**Objective:** Verify proper error handling for wrong password

**Steps:**
1. Go to http://localhost:3000/login
2. Enter: valid email (existing user)
3. Enter: `WrongPassword123`
4. Click "Sign in"

**Expected Result:** ✅ Error message: "Invalid credentials"

**If Failed:**
- Check password hashing is working correctly
- Verify user password is hashed, not plain text

---

### Test 4: Empty Fields
**Objective:** Verify client-side validation

**Steps:**
1. Go to http://localhost:3000/login
2. Leave email empty
3. Leave password empty
4. Click "Sign in"

**Expected Result:** ✅ Error message: "Please enter your user ID and password."

**If Failed:**
- Check form validation is working
- Should not send request to backend

---

### Test 5: Token Persistence
**Objective:** Verify token is saved and persists

**Steps:**
1. Log in successfully
2. Check localStorage (DevTools → Application → localStorage)
3. Should see `access_token` key with JWT value
4. Refresh page
5. Should still be logged in

**Expected Result:** ✅ Token visible in localStorage after login

**If Failed:**
- Check setAccessToken() function is being called
- Verify localStorage is not disabled

---

### Test 6: Logout
**Objective:** Verify logout works properly

**Steps:**
1. Log in successfully
2. Click user menu (top right)
3. Click "Logout"
4. Should redirect to login page

**Expected Result:** ✅ Redirected to /login with token cleared

**If Failed:**
- Check logout endpoint
- Verify token is cleared from localStorage

---

## Test Data Preparation

### Option A: Use Existing Seeded User
The database might have seeded test users. Check [Backend/db/schema.sql](Backend/db/schema.sql):

```sql
-- Query to check if users exist:
SELECT Id, Email, UserName, IsActive FROM Users;

-- Use any active user for testing
-- Email format is usually: firstname.lastname@uabindia.com
```

### Option B: Create Test User Manually
```sql
-- In SQL Server:
INSERT INTO Users (Email, UserName, PasswordHash, TenantId, IsActive, IsDeleted, CreatedAt)
VALUES (
  'test@example.com',
  'testuser',
  '$2a$11$...', -- Bcrypt hash of "TestPassword123"
  1,
  1,
  0,
  GETUTCDATE()
);
```

Or use the API if admin already exists:
```bash
curl -X POST http://localhost:5000/api/v1/users \
  -H "Authorization: Bearer {admin-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123",
    "userName": "testuser"
  }'
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Network Error" | Backend not running | Start backend: `dotnet run` |
| "CORS error" | Frontend domain not allowed | Backend CORS might be too restrictive |
| "Invalid credentials" always | Property names uppercase | Check if fix was applied ✅ |
| "Invalid credentials" sometimes | User doesn't exist | Create/verify test user exists |
| "Invalid credentials" always | Password wrong | Verify test user password |
| "Invalid request body" | Still sending uppercase property names | Make sure fix is in latest code |
| Stuck on login page | No response from API | Check Network tab for failed request |
| Token not saved | localStorage issue | Check browser settings, DevTools Console |
| Logged out immediately | Token invalid or expired | Check JWT secret in backend |

---

## Logging & Debugging

### Frontend Debug Mode
Add to [frontend-next/src/app/(auth)/login/page.tsx](frontend-next/src/app/(auth)/login/page.tsx):

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  // ... validation ...
  
  setIsLoading(true);
  try {
    const deviceId = getDeviceId();
    console.log("🔍 Login attempt:", { userId, deviceId });  // DEBUG
    
    const res = await apiClient.post("/auth/login", {
      email: userId,
      password: password,
      deviceId: deviceId,
    });
    
    console.log("✅ Login response:", res.status, res.data);  // DEBUG
    
    if (res.status === 200 && res.data?.access_token) {
      // ... rest of code ...
    }
  } catch (err: any) {
    console.error("❌ Login error:", err?.response?.status, err?.response?.data);  // DEBUG
    setError(err?.response?.data?.message || err?.message || "Login failed");
  }
};
```

### Backend Debug Mode
Already enabled in [Backend/src/UabIndia.Api/Controllers/AuthController.cs](Backend/src/UabIndia.Api/Controllers/AuthController.cs):

```csharp
if (_env.IsDevelopment())
{
    _logger.LogDebug("Bound LoginRequest values: Email={Email}, DeviceId={DeviceId}", req?.Email, req?.DeviceId);
    _logger.LogDebug("ModelState IsValid={IsValid}", ModelState.IsValid);
}
```

Watch backend logs during test:
```
[DEBUG] Bound LoginRequest values: Email=admin@example.com, DeviceId=dev-xxxxx
[DEBUG] ModelState IsValid=true     # ✅ Should be TRUE after fix
```

---

## Success Criteria

✅ **All tests should pass:**
- [ ] Valid credentials login works
- [ ] Invalid email shows error
- [ ] Invalid password shows error
- [ ] Empty fields show validation error
- [ ] Token is saved to localStorage
- [ ] Logout works properly
- [ ] Can re-login after logout
- [ ] No errors in browser console
- [ ] No errors in backend logs

---

## Test Report Template

```markdown
# Login Test Report - [Date]

## Environment
- Backend: localhost:5000 ✅ / api.uabindia.in ⏳
- Frontend: localhost:3000 ✅ / https://hrms.uabindia.in ⏳
- Test User: [email@example.com]

## Test Results
- [ ] Valid credentials: PASS / FAIL
- [ ] Invalid email: PASS / FAIL
- [ ] Invalid password: PASS / FAIL
- [ ] Token saved: PASS / FAIL
- [ ] Logout: PASS / FAIL

## Issues Found
- [List any errors or unexpected behavior]

## Screenshots
- [Attach successful login screenshots]
- [Attach error messages if any]

## Notes
- [Any additional observations]
```

---

## Automated Testing (Optional)

```typescript
// Simple test using Jest/Cypress
test("Login with valid credentials", async () => {
  // 1. Navigate to login page
  visit("http://localhost:3000/login");
  
  // 2. Fill in credentials
  cy.get("#login-userid").type("admin@example.com");
  cy.get("#login-password").type("Password123");
  
  // 3. Submit
  cy.get("button[type=submit]").click();
  
  // 4. Verify redirect to dashboard
  cy.url().should("include", "/app/modules/hrms");
  
  // 5. Verify token in localStorage
  cy.window().then((window) => {
    const token = window.localStorage.getItem("access_token");
    expect(token).to.exist;
  });
});
```

---

## After Successful Login Testing

1. ✅ Document test results
2. ✅ Fix any identified issues
3. ✅ Deploy backend to api.uabindia.in
4. ✅ Test with production API
5. ✅ Set up monitoring for login errors

---

**Status:** Ready to test  
**Last Updated:** February 3, 2026  
**Next Step:** Run local test with backend + frontend
