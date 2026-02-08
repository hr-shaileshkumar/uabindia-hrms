# Company Master - CRUD Testing & Deployment Checklist

**Date**: February 2, 2026  
**Status**: ✅ DATABASE MIGRATION COMPLETE  
**Next Step**: Start API Server & Run Tests

---

## ✅ Completed: Database Migration

**Migration Status**: SUCCESS  
```
✓ All 30 new columns added to Companies table
✓ Total columns in Companies table: 37 (7 original + 30 new)
✓ Performance indexes created
✓ Database schema ready for API deployment
```

**Added Columns**:
- Code (NVARCHAR 50)
- RegistrationNumber, TaxId, Email, PhoneNumber
- WebsiteUrl, LogoUrl
- Industry, CompanySize, MaxEmployees
- RegistrationAddress, OperationalAddress
- City, State, PostalCode, Country
- BankAccountNumber, BankName, BankBranch, IFSCCode
- FinancialYearStart, FinancialYearEnd
- ContactPersonName, ContactPersonPhone, ContactPersonEmail
- HR_PersonName, HR_PersonEmail
- Notes

---

## 🚀 NEXT: Deploy & Test CRUD Operations

### Step 1: Start the Backend API Server

```powershell
# Navigate to API project
cd C:\Users\hp\Desktop\HRMS\Backend\src\UabIndia.Api

# Run the API server
dotnet run

# Expected output:
# info: Microsoft.Hosting.Lifetime[14]
#       Now listening on: http://localhost:5000
```

**Verify Server is Running**:
```powershell
# In another terminal, test connectivity
curl http://localhost:5000/health
```

---

### Step 2: CRUD Test Cases

#### **Test 1: Create a Company (POST)**

```bash
curl -X POST http://localhost:5000/api/v1/companies \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Corp India",
    "legalName": "Test Corporation Pvt Ltd",
    "code": "TEST001",
    "industry": "IT Services",
    "companySize": "Large",
    "maxEmployees": 500,
    "registrationNumber": "U72900DL2024PTC391234",
    "taxId": "27AAFCD5055K1Z0",
    "email": "info@testcorp.com",
    "phoneNumber": "+91 9876543210",
    "websiteUrl": "https://www.testcorp.com",
    "registrationAddress": "123 Business Park, MG Road, Bangalore",
    "operationalAddress": "456 Tech Plaza, Whitefield, Bangalore",
    "city": "Bangalore",
    "state": "Karnataka",
    "postalCode": "560001",
    "country": "India",
    "bankAccountNumber": "50100054321098",
    "bankName": "HDFC Bank",
    "bankBranch": "Whitefield",
    "ifscCode": "HDFC0000236",
    "financialYearStart": "04-01",
    "financialYearEnd": "03-31",
    "contactPersonName": "Rajesh Kumar",
    "contactPersonPhone": "+91 9123456789",
    "contactPersonEmail": "rajesh@testcorp.com",
    "hr_PersonName": "Priya Singh",
    "hr_PersonEmail": "priya.hr@testcorp.com",
    "notes": "Test company for UAB HRMS",
    "isActive": true
  }'
```

**Expected Response** (201 Created):
```json
{
  "message": "Company created successfully",
  "company": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Test Corp India",
    "code": "TEST001",
    ... (all 30+ fields)
  }
}
```

**Validation Checklist**:
- [ ] HTTP Status: 201 Created
- [ ] Response contains all submitted fields
- [ ] Company ID is a valid GUID
- [ ] Email field populated correctly
- [ ] Address fields stored properly
- [ ] Banking fields saved
- [ ] Contact fields included
- [ ] isActive = true

---

#### **Test 2: List Companies (GET with Pagination)**

```bash
curl -X GET "http://localhost:5000/api/v1/companies?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "companies": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Test Corp India",
      "code": "TEST001",
      "email": "info@testcorp.com",
      ... (all fields)
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

**Validation Checklist**:
- [ ] HTTP Status: 200 OK
- [ ] Returns array of companies
- [ ] Pagination metadata (total, page, limit) present
- [ ] Only active companies listed (IsDeleted = 0)
- [ ] Multi-tenant isolation working (only tenant's companies)

---

#### **Test 3: Get Single Company (GET by ID)**

```bash
# Replace with actual company ID from Test 1
COMPANY_ID="550e8400-e29b-41d4-a716-446655440000"

curl -X GET "http://localhost:5000/api/v1/companies/$COMPANY_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "company": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Test Corp India",
    ... (all 30+ fields)
  }
}
```

**Validation Checklist**:
- [ ] HTTP Status: 200 OK
- [ ] Returns all company fields
- [ ] All nested objects populated
- [ ] Response time < 100ms

---

#### **Test 4: Update Company (PUT)**

```bash
COMPANY_ID="550e8400-e29b-41d4-a716-446655440000"

curl -X PUT "http://localhost:5000/api/v1/companies/$COMPANY_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@testcorp.com",
    "phoneNumber": "+91 9876543211",
    "maxEmployees": 600,
    "bankAccountNumber": "50100054321099",
    "notes": "Updated test company details"
  }'
```

**Expected Response** (200 OK):
```json
{
  "message": "Company updated successfully",
  "company": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "newemail@testcorp.com",
    "phoneNumber": "+91 9876543211",
    "maxEmployees": 600,
    ... (all fields with updates)
  }
}
```

**Validation Checklist**:
- [ ] HTTP Status: 200 OK
- [ ] Only updated fields changed
- [ ] Other fields remain unchanged
- [ ] Database record updated (verify with SELECT)
- [ ] UpdatedAt timestamp changed

---

#### **Test 5: Delete Company (DELETE - Soft Delete)**

```bash
COMPANY_ID="550e8400-e29b-41d4-a716-446655440000"

curl -X DELETE "http://localhost:5000/api/v1/companies/$COMPANY_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response** (200 OK):
```json
{
  "message": "Company deleted successfully"
}
```

**Validation Checklist**:
- [ ] HTTP Status: 200 OK
- [ ] Company no longer appears in list (GET /companies)
- [ ] Company record still in database (IsDeleted = 1)
- [ ] Can't retrieve with GET by ID (returns 404 for frontend)

---

#### **Test 6: Verify Soft Delete Behavior**

```bash
# List companies - deleted one should NOT appear
curl -X GET "http://localhost:5000/api/v1/companies?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Try to get deleted company - should return 404
curl -X GET "http://localhost:5000/api/v1/companies/$COMPANY_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Validation Checklist**:
- [ ] Deleted company not in list
- [ ] GET by ID returns 404
- [ ] Record still in database with IsDeleted=1
- [ ] Soft delete preserves data integrity

---

### Step 3: Authorization & Security Tests

#### **Test 7: Non-Admin Cannot Create**

```bash
# Use regular user token (not admin)
curl -X POST http://localhost:5000/api/v1/companies \
  -H "Authorization: Bearer REGULAR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

**Expected Response** (403 Forbidden):
```json
{
  "message": "Access denied. AdminOnly policy required."
}
```

**Validation Checklist**:
- [ ] HTTP Status: 403 Forbidden
- [ ] Regular users can't create companies
- [ ] Admin users can create companies
- [ ] Authorization properly enforced

---

#### **Test 8: Multi-Tenant Isolation**

```bash
# Create company in Tenant A
# Create company in Tenant B
# Switch to Tenant A - should only see Tenant A companies

# Both operations should return only their own companies
```

**Validation Checklist**:
- [ ] Tenant A sees only Tenant A companies
- [ ] Tenant B sees only Tenant B companies
- [ ] No cross-tenant data leakage
- [ ] List query filters by TenantId

---

### Step 4: Error Handling Tests

#### **Test 9: Invalid Company ID**

```bash
curl -X GET "http://localhost:5000/api/v1/companies/invalid-id" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response** (400 Bad Request or 404 Not Found)

---

#### **Test 10: Missing Required Fields**

```bash
curl -X POST http://localhost:5000/api/v1/companies \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "legalName": "Test Corp"
    # Missing "name" which is required
  }'
```

**Expected Response** (400 Bad Request):
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "name": ["The Name field is required."]
  }
}
```

---

#### **Test 11: Duplicate Company Code (Per Tenant)**

```bash
# Create first company with code "UNIQUE001"
# Try to create another with same code "UNIQUE001"
```

**Expected Response** (400 Bad Request):
```json
{
  "message": "Company code already exists"
}
```

---

### Step 5: Frontend Integration Tests

Once backend tests pass, test frontend integration:

```bash
# 1. Navigate to http://localhost:3000 (frontend)
# 2. Go to Platform > Companies
# 3. Verify companies list loads
# 4. Test each tab:
#    - List tab: See all companies with pagination
#    - General tab: View/edit company info
#    - Address tab: View/edit addresses
#    - Banking tab: View/edit banking details
#    - Contacts tab: View/edit contact persons
```

---

## 📋 Complete Testing Checklist

### Backend API Tests
- [ ] **POST /companies** - Create new company
- [ ] **GET /companies** - List with pagination
- [ ] **GET /companies/{id}** - Get single company
- [ ] **PUT /companies/{id}** - Update company
- [ ] **DELETE /companies/{id}** - Soft delete company

### Authorization Tests
- [ ] Admin can create/update/delete
- [ ] Regular user cannot create/update/delete
- [ ] Multi-tenant isolation verified
- [ ] Authorization headers working

### Data Validation Tests
- [ ] Required field validation
- [ ] Email format validation
- [ ] Duplicate code rejection (per tenant)
- [ ] Field length validation

### Error Handling Tests
- [ ] 400 Bad Request for validation errors
- [ ] 401 Unauthorized for missing token
- [ ] 403 Forbidden for insufficient permissions
- [ ] 404 Not Found for non-existent company
- [ ] 500 Server error properly handled

### Frontend Tests
- [ ] Page loads without errors
- [ ] Companies list displays correctly
- [ ] Pagination works
- [ ] Create new company form works
- [ ] Edit company form works
- [ ] Delete confirmation dialog appears
- [ ] Form validation messages display
- [ ] Error messages show properly
- [ ] Success notifications appear

---

## 🔧 Troubleshooting

### Issue: API Not Starting
```
Solution: Check appsettings.Development.json for correct database connection
```

### Issue: Database Connection Failed
```
Solution: Verify SQL Server is running and connection string is correct
```

### Issue: Authorization Always Returns 403
```
Solution: Verify JWT token includes required claims and admin role
```

### Issue: Pagination Not Working
```
Solution: Check that page and limit parameters are passed correctly
```

---

## 📊 Performance Baselines

After testing, record these metrics:

| Operation | Target | Actual | Status |
|-----------|--------|--------|--------|
| GET /companies (list 10) | < 100ms | | |
| GET /companies/{id} | < 50ms | | |
| POST /companies | < 200ms | | |
| PUT /companies/{id} | < 150ms | | |
| DELETE /companies/{id} | < 100ms | | |

---

## ✅ Deployment Readiness Checklist

Once all tests pass, system is ready for deployment:

- [ ] Database migration applied successfully
- [ ] All CRUD endpoints tested
- [ ] Authorization working correctly
- [ ] Multi-tenant isolation verified
- [ ] Error handling working
- [ ] Frontend integration complete
- [ ] Performance acceptable
- [ ] No console errors
- [ ] Documentation updated
- [ ] Ready for production deployment

---

**Next Step**: Start backend API server and run through all test cases above.

When all tests pass, system is production-ready! 🚀
