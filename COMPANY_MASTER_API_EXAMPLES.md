# Company Master - API Examples & Usage

## API Endpoints

### 1. List Companies (with Pagination)
```
GET /api/v1/companies?page=1&limit=10
Authorization: Bearer <token>
```

**Response**:
```json
{
  "companies": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "ABC Corporation",
      "legalName": "ABC Private Limited",
      "code": "ABC001",
      "registrationNumber": "U72900DL2024PTC391234",
      "taxId": "27AAFCD5055K1Z0",
      "email": "info@abccorp.com",
      "phoneNumber": "+91 9876543210",
      "websiteUrl": "https://www.abccorp.com",
      "logoUrl": "https://cdn.example.com/abc-logo.png",
      "industry": "IT Services",
      "companySize": "Large",
      "registrationAddress": "123 Business Park, MG Road",
      "operationalAddress": "456 Tech Plaza, Whitefield",
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
      "maxEmployees": 500,
      "contactPersonName": "Rajesh Kumar",
      "contactPersonPhone": "+91 9123456789",
      "contactPersonEmail": "rajesh@abccorp.com",
      "hr_PersonName": "Priya Singh",
      "hr_PersonEmail": "priya.hr@abccorp.com",
      "notes": "Primary office location for operations",
      "isActive": true
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "XYZ Solutions",
      "legalName": "XYZ Solutions Pvt Ltd",
      "code": "XYZ002",
      ...
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

---

### 2. Get Single Company
```
GET /api/v1/companies/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>
```

**Response**:
```json
{
  "company": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "ABC Corporation",
    "legalName": "ABC Private Limited",
    "code": "ABC001",
    ... (all 30+ fields)
    "isActive": true
  }
}
```

---

### 3. Create Company
```
POST /api/v1/companies
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "New Tech Company",
  "legalName": "New Tech Company Pvt Ltd",
  "code": "NTC001",
  "industry": "Software Development",
  "companySize": "Medium",
  "maxEmployees": 250,
  "registrationNumber": "U72900DL2024PTC391234",
  "taxId": "27AAFCD5055K1Z0",
  "email": "info@newtech.com",
  "phoneNumber": "+91 9123456789",
  "websiteUrl": "https://www.newtech.com",
  "registrationAddress": "100 Tech Park Road, Bangalore",
  "operationalAddress": "100 Tech Park Road, Bangalore",
  "city": "Bangalore",
  "state": "Karnataka",
  "postalCode": "560001",
  "country": "India",
  "bankAccountNumber": "50100012345678",
  "bankName": "ICICI Bank",
  "bankBranch": "Indiranagar",
  "ifscCode": "ICIC0000001",
  "financialYearStart": "04-01",
  "financialYearEnd": "03-31",
  "contactPersonName": "John Smith",
  "contactPersonPhone": "+91 9876543210",
  "contactPersonEmail": "john@newtech.com",
  "hr_PersonName": "Sarah Johnson",
  "hr_PersonEmail": "sarah.hr@newtech.com",
  "notes": "New startup in tech industry",
  "isActive": true
}
```

**Response**:
```json
{
  "message": "Company created successfully",
  "company": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "name": "New Tech Company",
    ... (all provided fields)
  }
}
```

---

### 4. Update Company
```
PUT /api/v1/companies/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body** (Partial Update - only fields to update):
```json
{
  "email": "newemail@abccorp.com",
  "phoneNumber": "+91 9876543211",
  "contactPersonName": "Rajesh Kumar Singh",
  "maxEmployees": 600,
  "notes": "Updated office location info",
  "isActive": true
}
```

**Response**:
```json
{
  "message": "Company updated successfully",
  "company": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "ABC Corporation",
    "email": "newemail@abccorp.com",
    "phoneNumber": "+91 9876543211",
    "contactPersonName": "Rajesh Kumar Singh",
    "maxEmployees": 600,
    ... (all other fields with updated values)
  }
}
```

---

### 5. Delete Company (Soft Delete)
```
DELETE /api/v1/companies/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>
```

**Response**:
```json
{
  "message": "Company deleted successfully"
}
```

**Note**: This performs a soft delete (IsDeleted = 1). The company record remains in the database but won't appear in list operations.

---

## cURL Examples

### Create Company
```bash
curl -X POST http://localhost:5000/api/v1/companies \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ABC Corporation",
    "code": "ABC001",
    "industry": "IT Services",
    "email": "info@abccorp.com",
    "isActive": true
  }'
```

### List Companies
```bash
curl -X GET "http://localhost:5000/api/v1/companies?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Single Company
```bash
curl -X GET http://localhost:5000/api/v1/companies/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Company
```bash
curl -X PUT http://localhost:5000/api/v1/companies/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@abccorp.com",
    "phoneNumber": "+91 9123456789"
  }'
```

### Delete Company
```bash
curl -X DELETE http://localhost:5000/api/v1/companies/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Postman Collection

### Environment Variables
```json
{
  "base_url": "http://localhost:5000",
  "api_token": "eyJhbGc...",
  "company_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Requests

**1. List Companies**
- **Method**: GET
- **URL**: `{{base_url}}/api/v1/companies?page=1&limit=10`
- **Headers**: 
  - Authorization: Bearer {{api_token}}

**2. Create Company**
- **Method**: POST
- **URL**: `{{base_url}}/api/v1/companies`
- **Headers**: 
  - Authorization: Bearer {{api_token}}
  - Content-Type: application/json
- **Body**: (JSON - see Create Company section above)

**3. Get Company**
- **Method**: GET
- **URL**: `{{base_url}}/api/v1/companies/{{company_id}}`
- **Headers**: 
  - Authorization: Bearer {{api_token}}

**4. Update Company**
- **Method**: PUT
- **URL**: `{{base_url}}/api/v1/companies/{{company_id}}`
- **Headers**: 
  - Authorization: Bearer {{api_token}}
  - Content-Type: application/json
- **Body**: (JSON - see Update Company section above)

**5. Delete Company**
- **Method**: DELETE
- **URL**: `{{base_url}}/api/v1/companies/{{company_id}}`
- **Headers**: 
  - Authorization: Bearer {{api_token}}

---

## Frontend Usage Examples

### React Component Integration

```typescript
import { hrApi } from "@/lib/hrApi";

// List companies
const fetchCompanies = async () => {
  const res = await hrApi.company.getAll(1, 10);
  setCompanies(res.data.companies);
};

// Create company
const createCompany = async (data) => {
  const res = await hrApi.company.create({
    name: "New Company",
    code: "NC001",
    email: "info@newcompany.com",
    isActive: true
  });
  console.log(res.data.company);
};

// Get single company
const getCompany = async (id) => {
  const res = await hrApi.company.getById(id);
  setCompany(res.data.company);
};

// Update company
const updateCompany = async (id, data) => {
  const res = await hrApi.company.update(id, {
    email: "newemail@company.com",
    maxEmployees: 500
  });
  console.log(res.data.company);
};

// Delete company
const deleteCompany = async (id) => {
  await hrApi.company.delete(id);
  // Refresh list
  fetchCompanies();
};
```

---

## Error Responses

### 400 Bad Request - Validation Error
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

### 400 Bad Request - Business Rule Violation
```json
{
  "message": "Company code already exists"
}
```

### 401 Unauthorized
```json
{
  "message": "Unauthorized"
}
```

### 403 Forbidden (Non-Admin trying to write)
```json
{
  "message": "Access denied. AdminOnly policy required."
}
```

### 404 Not Found
```json
{
  "message": "Company not found"
}
```

---

## Field Validation Rules

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| name | string | Yes | Min: 3 chars, Max: 256 chars |
| legalName | string | No | Max: 512 chars |
| code | string | No | Max: 50 chars, Unique per tenant |
| registrationNumber | string | No | Max: 100 chars |
| taxId | string | No | Max: 50 chars (GST/PAN format) |
| email | string | No | Valid email format |
| phoneNumber | string | No | Max: 20 chars |
| websiteUrl | string | No | Valid URL format |
| logoUrl | string | No | Valid URL format |
| industry | string | No | Max: 100 chars |
| companySize | string | No | One of: Small, Medium, Large, Enterprise |
| city | string | No | Max: 100 chars |
| state | string | No | Max: 100 chars |
| postalCode | string | No | Max: 20 chars |
| country | string | No | Max: 100 chars |
| bankAccountNumber | string | No | Max: 50 chars |
| bankName | string | No | Max: 256 chars |
| bankBranch | string | No | Max: 256 chars |
| ifscCode | string | No | Max: 20 chars |
| financialYearStart | string | No | Format: MM-DD (e.g., 04-01) |
| financialYearEnd | string | No | Format: MM-DD (e.g., 03-31) |
| maxEmployees | integer | No | Positive number |
| contactPersonName | string | No | Max: 256 chars |
| contactPersonPhone | string | No | Max: 20 chars |
| contactPersonEmail | string | No | Valid email format |
| hr_PersonName | string | No | Max: 256 chars |
| hr_PersonEmail | string | No | Valid email format |
| notes | string | No | Max: 2000 chars |
| isActive | boolean | No | Default: true |

---

## Common Scenarios

### Scenario 1: Onboarding New Company
```typescript
// 1. Create basic company
const company = await hrApi.company.create({
  name: "TechCorp India",
  code: "TECH001",
  industry: "IT Services",
  companySize: "Large",
  maxEmployees: 500,
  isActive: true
});

// 2. Update with address
await hrApi.company.update(company.data.company.id, {
  registrationAddress: "Address Line 1",
  operationalAddress: "Address Line 2",
  city: "Bangalore",
  state: "Karnataka",
  postalCode: "560001"
});

// 3. Update with banking
await hrApi.company.update(company.data.company.id, {
  bankName: "HDFC Bank",
  bankAccountNumber: "50100054321098",
  ifscCode: "HDFC0000236"
});
```

### Scenario 2: Migrating Company Info
```typescript
// Fetch all companies and update
const res = await hrApi.company.getAll(1, 100);
const companies = res.data.companies;

for (const company of companies) {
  await hrApi.company.update(company.id, {
    financialYearStart: "04-01",
    financialYearEnd: "03-31"
  });
}
```

### Scenario 3: Retrieve Company for Payroll
```typescript
// Get banking details for salary processing
const company = await hrApi.company.getById(employeeCompanyId);

const paymentDetails = {
  bankAccount: company.bankAccountNumber,
  bankName: company.bankName,
  ifscCode: company.ifscCode
};

// Process salary transfer
await payrollService.initiateSalaryTransfer(paymentDetails);
```

---

## Rate Limiting & Best Practices

- **Pagination**: Use page and limit parameters
- **Caching**: Cache company list for 30 minutes
- **Filtering**: Use query parameters for filtering (future enhancement)
- **Bulk Operations**: Use batch API for multiple creates/updates (future enhancement)

---

## Testing Commands

```bash
# Test connectivity
curl http://localhost:5000/health

# Test authentication
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/v1/companies

# Test with invalid token
curl -H "Authorization: Bearer INVALID_TOKEN" \
  http://localhost:5000/api/v1/companies

# Test pagination
curl "http://localhost:5000/api/v1/companies?page=2&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

**All APIs are production-ready and fully documented!** 🚀
