# ✅ SPRINT 1 SECURITY HARDENING - IMPLEMENTATION CHECKLIST

**Sprint Duration:** Week 1-2 (10 business days)  
**Target Completion:** Friday EOD  
**Daily Standup:** 10 AM IST  
**Status:** NOT STARTED

---

## 📋 TASK 1: SECURITY HEADERS MIDDLEWARE

### 1a: Create SecurityHeadersMiddleware.cs
- [ ] Create file: `Backend/src/UabIndia.Api/Middleware/SecurityHeadersMiddleware.cs`
- [ ] Copy code from `SPRINT_1_SECURITY_HARDENING.md` - Task 1 Step 1
- [ ] Add using statements
- [ ] Verify compilation (no errors)
- [ ] Code review completed
- **Assigned To:** Backend Lead  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 1 hour

### 1b: Update Program.cs
- [ ] Open `Backend/src/UabIndia.Api/Program.cs`
- [ ] Add middleware registration (code from Step 2)
- [ ] Update CORS configuration
- [ ] Verify compilation
- [ ] Test HTTPS redirect works
- **Assigned To:** Backend Lead  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 0.5 hours

### 1c: Verify Headers in Response
- [ ] Start backend: `dotnet run --project src/UabIndia.Api`
- [ ] Open browser DevTools (F12)
- [ ] Go to Network tab
- [ ] Make request to `http://localhost:5000/api/v1/health`
- [ ] Verify response headers contain:
  - [ ] `Strict-Transport-Security: max-age=31536000`
  - [ ] `Content-Security-Policy: default-src 'self'`
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `X-Frame-Options: DENY`
  - [ ] `Permissions-Policy: geolocation=(), microphone=()`
- [ ] Screenshot for documentation
- **Assigned To:** QA Engineer  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 0.5 hours

### 1d: Code Review
- [ ] Peer review completed
- [ ] No hardcoded values
- [ ] Follows naming conventions
- [ ] Error handling adequate
- [ ] Comments added where needed
- **Assigned To:** Tech Lead  
- **Status:** ⏳ Not Started

---

## 📋 TASK 2: TOKEN REVOCATION SYSTEM

### 2a: Create RevokedToken Entity
- [ ] Create file: `Backend/src/UabIndia.Core/Entities/RevokedToken.cs`
- [ ] Copy entity code from `SPRINT_1_SECURITY_HARDENING.md` - Task 2 Step 1
- [ ] Verify properties:
  - [ ] Id (Guid)
  - [ ] TokenId (Guid)
  - [ ] UserId (Guid)
  - [ ] TokenHash (string)
  - [ ] RevokedAt (DateTime)
  - [ ] ExpiresAt (DateTime)
  - [ ] Reason (string)
- [ ] Add to DbContext
- [ ] Verify compilation
- **Assigned To:** Backend Lead  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 1 hour

### 2b: Create Database Migration
- [ ] Create migration: `Add-Migration AddRevokedTokensTable`
- [ ] Verify SQL generated matches schema.sql from Step 2
- [ ] Check indexes are created:
  - [ ] Index on UserId
  - [ ] Index on ExpiresAt
  - [ ] Index on TokenHash
- [ ] Apply migration: `Update-Database`
- [ ] Verify table exists: `SELECT * FROM RevokedTokens` (should be empty)
- **Assigned To:** Backend Lead  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 1 hour

### 2c: Create RevokedTokenRepository
- [ ] Create file: `Backend/src/UabIndia.Infrastructure/Repositories/RevokedTokenRepository.cs`
- [ ] Copy code from Step 3
- [ ] Implement methods:
  - [ ] `AddAsync()` - Add revoked token
  - [ ] `IsTokenRevokedAsync()` - Check if token is revoked
  - [ ] `CleanupExpiredTokensAsync()` - Remove old tokens
- [ ] Register in DI container
- [ ] Unit test: AddAsync stores token correctly
- [ ] Unit test: IsTokenRevokedAsync returns true for revoked token
- **Assigned To:** Backend Lead  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 1.5 hours

### 2d: Update AuthController Logout
- [ ] Open `Backend/src/UabIndia.Api/Controllers/AuthController.cs`
- [ ] Find `Logout()` method
- [ ] Add token hashing logic
- [ ] Call `_revokedTokenRepository.AddAsync()`
- [ ] Clear cookies
- [ ] Return success response
- [ ] Copy code from Step 4
- **Assigned To:** Backend Lead  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 1 hour

### 2e: Update JWT Validation
- [ ] Open `Backend/src/UabIndia.Api/Program.cs`
- [ ] Find JWT bearer authentication configuration
- [ ] Add `OnTokenValidated` event
- [ ] Check token against revoked tokens
- [ ] Reject if token is revoked
- [ ] Copy code from Step 5
- **Assigned To:** Backend Lead  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 1 hour

### 2f: Test Token Revocation
- [ ] Login and get token
- [ ] Make API call with token (should work)
- [ ] Logout and revoke token
- [ ] Make API call with same token (should return 401)
- [ ] New login should work with new token
- [ ] Add test to unit tests
- **Assigned To:** QA Engineer  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 1 hour

---

## 📋 TASK 3: FLUENT VALIDATION

### 3a: Install NuGet Package
- [ ] Run: `dotnet add package FluentValidation`
- [ ] Verify package installed
- [ ] Check version: `dotnet list package`
- **Assigned To:** Backend Lead  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 0.25 hours

### 3b: Create LoginRequestValidator
- [ ] Create file: `Backend/src/UabIndia.Application/Validators/LoginRequestValidator.cs`
- [ ] Copy code from Task 3 Step 1
- [ ] Verify all rules:
  - [ ] Email required
  - [ ] Email format validation
  - [ ] Password required
  - [ ] Password min 6 characters
  - [ ] Password has uppercase
  - [ ] Password has lowercase
  - [ ] Password has digit
  - [ ] Password has special character
- [ ] Unit test: Valid email passes
- [ ] Unit test: Invalid email fails with correct message
- [ ] Unit test: Weak password fails
- **Assigned To:** Backend Lead  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 1 hour

### 3c: Create CreateUserValidator
- [ ] Create file: `Backend/src/UabIndia.Application/Validators/CreateUserValidator.cs`
- [ ] Copy code from Task 3 Step 2
- [ ] Verify all rules:
  - [ ] Email validation
  - [ ] First name required + format
  - [ ] Last name required + format
  - [ ] Phone number required + format (10 digits)
  - [ ] Role required
  - [ ] Company required
  - [ ] Password validation
- [ ] Unit tests for each field
- **Assigned To:** Backend Lead  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 1 hour

### 3d: Register Validators
- [ ] Open `Backend/src/UabIndia.Api/Program.cs`
- [ ] Add line: `builder.Services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>();`
- [ ] Verify compilation
- **Assigned To:** Backend Lead  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 0.25 hours

### 3e: Test Validation
- [ ] Test login with invalid email
  - Expected: 400 Bad Request with error message
- [ ] Test login with weak password
  - Expected: 400 Bad Request with all password rules
- [ ] Test login with valid credentials
  - Expected: 200 OK
- [ ] Test create user with missing fields
  - Expected: 400 Bad Request with field-specific errors
- **Assigned To:** QA Engineer  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 1 hour

---

## 📋 TASK 4: STRUCTURED ERROR RESPONSES

### 4a: Create ErrorCode Enum
- [ ] Create file: `Backend/src/UabIndia.Core/Exceptions/ErrorCode.cs`
- [ ] Copy code from Task 4 Step 1
- [ ] Verify all error codes present:
  - [ ] Auth errors (1000-1999)
  - [ ] Validation errors (2000-2999)
  - [ ] Not found errors (3000-3999)
  - [ ] Permission errors (4000-4999)
  - [ ] Business logic errors (5000-5999)
  - [ ] External service errors (6000-6999)
  - [ ] Server errors (7000-7999)
- **Assigned To:** Backend Lead  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 0.5 hours

### 4b: Create ErrorResponse DTO
- [ ] Create file: `Backend/src/UabIndia.Api/Dtos/ErrorResponse.cs`
- [ ] Copy code from Task 4 Step 2
- [ ] Verify properties:
  - [ ] ErrorCode (int)
  - [ ] Message (string)
  - [ ] Details (string)
  - [ ] ValidationErrors (dictionary)
  - [ ] RequestId (string)
  - [ ] Timestamp (string)
- [ ] Create unit tests for DTO
- **Assigned To:** Backend Lead  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 0.5 hours

### 4c: Create Exception Handling Middleware
- [ ] Create file: `Backend/src/UabIndia.Api/Middleware/ExceptionHandlingMiddleware.cs`
- [ ] Copy code from Task 4 Step 3
- [ ] Verify exception handling for:
  - [ ] ValidationException → 400
  - [ ] UnauthorizedAccessException → 401
  - [ ] KeyNotFoundException → 404
  - [ ] Generic Exception → 500
- [ ] Add logging for all exceptions
- **Assigned To:** Backend Lead  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 1 hour

### 4d: Register in Program.cs
- [ ] Open `Backend/src/UabIndia.Api/Program.cs`
- [ ] Add: `app.UseMiddleware<ExceptionHandlingMiddleware>();`
- [ ] Ensure it's registered AFTER routing but BEFORE endpoints
- [ ] Verify compilation
- **Assigned To:** Backend Lead  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 0.25 hours

### 4e: Update All Controllers
- [ ] Find all API endpoints
- [ ] Update to return ErrorResponse on errors
- [ ] Test each endpoint:
  - [ ] Valid request → proper response
  - [ ] Invalid request → 400 with validation errors
  - [ ] Not found → 404
  - [ ] Unauthorized → 401
  - [ ] Server error → 500 with structured response
- **Assigned To:** Backend Lead + QA  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 2 hours

---

## 📋 TASK 5: STRENGTHEN RATE LIMITING

### 5a: Install Rate Limiting
- [ ] Verify Microsoft.AspNetCore.RateLimiting is included
- [ ] If not: `dotnet add package Microsoft.AspNetCore.RateLimiting`
- **Assigned To:** Backend Lead  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 0.25 hours

### 5b: Configure Rate Limiting Policies
- [ ] Open `Backend/src/UabIndia.Api/Program.cs`
- [ ] Add three policies:
  - [ ] `login`: 5 requests per 15 minutes
  - [ ] `api`: 100 requests per minute
  - [ ] `payment`: 10 requests per 5 minutes
- [ ] Add rejection handler (429 status)
- [ ] Copy code from Task 5
- **Assigned To:** Backend Lead  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 0.5 hours

### 5c: Apply Rate Limiting to Endpoints
- [ ] Add `[EnableRateLimiting("login")]` to Login endpoint
- [ ] Add `[EnableRateLimiting("api")]` to all public endpoints
- [ ] Add `[EnableRateLimiting("payment")]` to payment endpoints
- [ ] Verify compilation
- **Assigned To:** Backend Lead  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 0.5 hours

### 5d: Test Rate Limiting
- [ ] Test login endpoint: Make 6 rapid requests
  - Expected: 6th request returns 429 Too Many Requests
- [ ] Test API endpoint: Make 101 rapid requests
  - Expected: Requests after 100 return 429
- [ ] Test recovery: Wait 15 min, login again
  - Expected: Should work
- [ ] Load test with k6
- **Assigned To:** QA Engineer  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 1 hour

---

## 📋 TASK 6: CSRF TOKEN PROTECTION

### 6a: Create CSRF Token Service (Backend)
- [ ] Open `Backend/src/UabIndia.Api/Controllers/AuthController.cs`
- [ ] Add GetCsrfToken() method
- [ ] Generate random GUID token
- [ ] Store in session
- [ ] Return to frontend
- [ ] Test via Postman
- **Assigned To:** Backend Lead  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 0.5 hours

### 6b: Create CSRF Validator Attribute
- [ ] Create file: `Backend/src/UabIndia.Api/Middleware/ValidateCsrfTokenAttribute.cs`
- [ ] Copy code from Task 6
- [ ] Implement validation logic
- [ ] Verify implementation
- **Assigned To:** Backend Lead  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 1 hour

### 6c: Create Frontend CSRF Service
- [ ] Create file: `frontend-next/src/lib/csrfToken.ts`
- [ ] Copy code from Task 6 (Frontend Implementation)
- [ ] Implement `getCsrfToken()` function
- [ ] Implement `initializeCsrfToken()` function
- [ ] Test that token is stored
- **Assigned To:** Frontend Lead  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 0.5 hours

### 6d: Update Frontend Layout
- [ ] Open `frontend-next/src/app/(protected)/layout.tsx`
- [ ] Add useEffect to initialize CSRF token
- [ ] Verify token is stored in sessionStorage
- [ ] Test console shows no errors
- **Assigned To:** Frontend Lead  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 0.5 hours

### 6e: Update API Client
- [ ] Open `frontend-next/src/lib/apiClient.ts`
- [ ] Add CSRF token to all POST/PUT/DELETE requests
- [ ] Verify header is sent: `X-CSRF-Token`
- [ ] Test with browser DevTools
- **Assigned To:** Frontend Lead  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 0.5 hours

### 6f: Test CSRF Protection
- [ ] Test POST request WITH valid CSRF token
  - Expected: 200 OK
- [ ] Test POST request WITHOUT CSRF token
  - Expected: 401 Unauthorized
- [ ] Test POST request WITH invalid CSRF token
  - Expected: 401 Unauthorized
- [ ] Test GET request (should work without token)
  - Expected: 200 OK
- **Assigned To:** QA Engineer  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 1 hour

---

## 📋 TASK 7: ENCRYPT PII FIELDS

### 7a: Create EncryptionService
- [ ] Create file: `Backend/src/UabIndia.Core/Services/EncryptionService.cs`
- [ ] Copy code from Task 7
- [ ] Verify methods:
  - [ ] Encrypt(string plainText) → encrypted string
  - [ ] Decrypt(string cipherText) → original string
- [ ] Unit test: Encrypt then decrypt returns original value
- [ ] Unit test: Encrypted value ≠ original value
- **Assigned To:** Backend Lead  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 1 hour

### 7b: Configure Encryption Key
- [ ] Open `Backend/appsettings.json`
- [ ] Add encryption key (32+ character random string):
  ```json
  "Encryption": {
    "Key": "YourVerySecureEncryptionKeyHere123"
  }
  ```
- [ ] Store actual key in Azure Key Vault (not in code)
- [ ] Never commit real key to Git
- **Assigned To:** DevOps Engineer  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 0.5 hours

### 7c: Register EncryptionService in DI
- [ ] Open `Backend/src/UabIndia.Api/Program.cs`
- [ ] Add: `builder.Services.AddScoped<IEncryptionService, EncryptionService>();`
- [ ] Verify compilation
- **Assigned To:** Backend Lead  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 0.25 hours

### 7d: Update User Entity
- [ ] Open `Backend/src/UabIndia.Core/Entities/User.cs`
- [ ] Add private fields: `_email`, `_phoneNumber`
- [ ] Add properties with getters/setters that encrypt/decrypt
- [ ] Add constructor for DI
- [ ] Create migration: `Add-Migration EncryptPiiFields`
- [ ] Review migration SQL
- [ ] Update-Database
- **Assigned To:** Backend Lead  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 1.5 hours

### 7e: Create Data Migration Script
- [ ] Create script to encrypt existing data
- [ ] Run on existing database
- [ ] Verify all emails and phones are encrypted
- [ ] Test queries still work (decryption on read)
- [ ] Backup database before running
- **Assigned To:** Backend Lead + DevOps  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 1.5 hours

### 7f: Test PII Encryption
- [ ] Create new user with email + phone
- [ ] Query database directly
  - Expected: Email and phone are encrypted blobs
- [ ] Call API to get user
  - Expected: Email and phone are decrypted and readable
- [ ] Verify encryption uses unique IVs (verify values differ each time)
- **Assigned To:** QA Engineer  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 1 hour

---

## 📋 TASK 8: SAMESITE COOKIE CONFIGURATION

### 8a: Update Login Endpoint
- [ ] Open `Backend/src/UabIndia.Api/Controllers/AuthController.cs`
- [ ] Find Login response where cookies are set
- [ ] Update cookie options:
  ```csharp
  var cookieOptions = new CookieOptions
  {
      HttpOnly = true,
      Secure = true,
      SameSite = SameSiteMode.Strict,
      Expires = DateTimeOffset.UtcNow.AddDays(30)
  };
  ```
- [ ] Apply to both accessToken and refreshToken cookies
- [ ] Copy code from Task 8
- **Assigned To:** Backend Lead  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 0.5 hours

### 8b: Update Logout Endpoint
- [ ] Open logout method
- [ ] Set cookie expiry to past date when deleting
- [ ] Use same secure options
- **Assigned To:** Backend Lead  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 0.25 hours

### 8c: Test SameSite Cookies
- [ ] Login and check cookies in DevTools
  - Expected: SameSite=Strict
  - Expected: HttpOnly flag set
  - Expected: Secure flag set
- [ ] Test cross-site cookie behavior
  - Expected: Cookies NOT sent in cross-origin requests
- [ ] Test same-site requests
  - Expected: Cookies sent normally
- **Assigned To:** QA Engineer  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 0.5 hours

---

## 📋 TASK 9: TESTING & VALIDATION

### 9a: Unit Tests
- [ ] SecurityHeadersMiddleware tests
- [ ] RevokedToken entity tests
- [ ] Validation tests (email, password, phone)
- [ ] Error response tests
- [ ] EncryptionService tests
- **Target Coverage:** 80%
- **Assigned To:** Backend Lead + QA  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 4 hours

### 9b: Integration Tests
- [ ] Login flow end-to-end
- [ ] Logout and token revocation
- [ ] CSRF token generation and validation
- [ ] Rate limiting with actual requests
- [ ] Encryption/decryption in database
- **Assigned To:** QA Engineer  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 3 hours

### 9c: Security Testing
- [ ] Manual penetration testing
- [ ] OWASP ZAP scan
- [ ] SQL injection tests
- [ ] XSS tests
- [ ] CSRF tests
- **Assigned To:** Security Officer  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 4 hours

### 9d: Load Testing
- [ ] k6 load test with rate limiting
- [ ] Verify 429 responses under load
- [ ] Measure response times
- [ ] Check database performance
- **Assigned To:** DevOps  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 2 hours

---

## 📋 TASK 10: DOCUMENTATION & SIGN-OFF

### 10a: Code Documentation
- [ ] Add XML comments to all public methods
- [ ] Document all parameters and return values
- [ ] Add examples where applicable
- **Assigned To:** Backend Lead  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 1 hour

### 10b: API Documentation
- [ ] Document all security headers
- [ ] Document CSRF token flow
- [ ] Document error codes
- [ ] Document rate limiting rules
- [ ] Update Swagger/OpenAPI specs
- **Assigned To:** Tech Lead  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 1 hour

### 10c: Runbook
- [ ] Create runbook for common security issues
- [ ] Document rollback procedures
- [ ] Document troubleshooting steps
- [ ] Emergency contacts
- **Assigned To:** DevOps  
- **Status:** ⏳ Not Started  
- **Estimated Hours:** 1 hour

### 10d: Team Sign-Off
- [ ] Backend Lead: Code review completed ☐
- [ ] QA Lead: All tests passing ☐
- [ ] Security Officer: Security audit passed ☐
- [ ] DevOps Lead: Deployment ready ☐
- [ ] Tech Lead: Architecture review passed ☐
- **Status:** ⏳ Pending  

---

## 📊 PROGRESS SUMMARY

| Task | Status | Hours | Due Date | Owner |
|------|--------|-------|----------|-------|
| 1. Security Headers | ⏳ | 2 | Day 1 | Backend |
| 2. Token Revocation | ⏳ | 5 | Day 2 | Backend |
| 3. FluentValidation | ⏳ | 4 | Day 2 | Backend |
| 4. Error Responses | ⏳ | 3.5 | Day 1 | Backend |
| 5. Rate Limiting | ⏳ | 2 | Day 1 | Backend |
| 6. CSRF Tokens | ⏳ | 3.5 | Day 3 | Full Stack |
| 7. PII Encryption | ⏳ | 5.5 | Day 4 | Backend |
| 8. SameSite Cookies | ⏳ | 1 | Day 1 | Backend |
| 9. Testing | ⏳ | 13 | Day 5 | QA + Backend |
| 10. Documentation | ⏳ | 3 | Day 5 | Tech Lead |
| **TOTAL** | **⏳** | **42.5** | **Friday** | **Team** |

---

## 🎯 DEFINITION OF DONE

For each task to be considered complete:

- [ ] Code written and reviewed
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] No compilation errors
- [ ] No warnings
- [ ] Follows coding standards
- [ ] Documentation complete
- [ ] QA sign-off obtained
- [ ] Merged to develop branch
- [ ] Verified in staging environment

---

## 🚨 BLOCKERS & RISKS

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Database migration fails | Low | High | Test on staging first |
| Encryption breaks existing data | Low | Critical | Backup before running |
| Rate limiting too aggressive | Medium | Medium | Can adjust limits |
| CSRF token conflicts | Low | Low | Use unique token per session |
| Performance degradation | Medium | High | Load test before deploy |

---

## 📞 CONTACT INFORMATION

| Role | Name | Email | Phone |
|------|------|-------|-------|
| Backend Lead | TBD | - | - |
| Frontend Lead | TBD | - | - |
| QA Lead | TBD | - | - |
| DevOps | TBD | - | - |
| Security | TBD | - | - |

---

**Prepared By:** Tech Lead  
**Approved By:** Engineering Manager  
**Date:** February 4, 2026  
**Last Updated:** February 4, 2026  

---

## 🎉 NEXT STEPS (After Sprint 1)

Upon completion of all security hardening:

1. Deploy to staging environment
2. Run full security audit
3. Execute penetration testing
4. Get compliance certification
5. Begin Sprint 2: State Management & Performance
6. Schedule go-live date

**Estimated Total Cost:** $5,000-$8,000  
**Estimated ROI:** 100x (prevents $500K+ breach)
