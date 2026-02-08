# 🔍 Company Creation 500 Error - Diagnosis

**Issue:** Request failed with status code 500 when creating a new company

---

## Diagnostic Steps

### Step 1: Check Browser Console (F12)

**Open DevTools → Network tab → Filter for "companies" POST request**

1. Click "Create Company" button in the form
2. In Network tab, find the POST to `/api/v1/companies`
3. Click on it and check:

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Test Company",
  "legalName": "...",
  "code": "...",
  "financialYearStart": "???"  // <- CHECK THIS
  "financialYearEnd": "???"    // <- CHECK THIS
  ...
}
```

**Response (should show error details):**
```
Status: 500 Internal Server Error
Error Message: [Check what it says]
```

### Step 2: Check Backend Console

**Look at the terminal where `dotnet run` is running**

Watch for error messages like:
```
error: System.Exception: ...
error: Microsoft.EntityFrameworkCore...
```

### Step 3: Check Common Issues

#### ❌ Issue 1: Invalid Date Format
- `financialYearStart` and `financialYearEnd` might be sent as wrong format
- Backend expects: `"MM-DD"` format (e.g., `"04-01"`)
- Frontend might be sending: `null`, empty string, or date object

#### ❌ Issue 2: Required Fields Missing
- `Name` is required (you already check this)
- Other fields should be optional

#### ❌ Issue 3: String Encoding Issues
- HTML/JSON characters might not be properly escaped
- Special characters in input might cause parsing issues

#### ❌ Issue 4: Database Constraints
- Duplicate code/email in database
- Foreign key constraint violation
- Column type mismatch

---

## Temporary Fix: Disable Financial Year Fields

If the financial year fields are causing the error, we can make them optional in the frontend form until we fix the backend.

**Edit: frontend-next/src/app/(protected)/app/platform/companies/page.tsx**

Find the financial year input fields and comment them out:

```typescript
// Temporarily commented out to fix 500 error
// <input 
//   name="financialYearStart"
//   placeholder="MM-DD format"
//   ...
// />
// <input 
//   name="financialYearEnd"
//   placeholder="MM-DD format"
//   ...
// />
```

This will help us identify if the financial year fields are the culprit.

---

## Debug: Add Logging to Frontend

**Add this to the company create function in page.tsx:**

```typescript
const handleSave = async () => {
  if (!formData.name?.trim()) {
    setError("Company name is required");
    return;
  }

  try {
    setLoading(true);
    
    // DEBUG: Log what we're sending
    console.log("📤 Sending company data:", JSON.stringify(formData, null, 2));
    
    if (editingId) {
      await hrApi.company.update(editingId, formData);
    } else {
      await hrApi.company.create(formData);
    }
    
    setError(null);
    setActiveTab("list");
    setFormData({ isActive: true });
    setEditingId(null);
    await fetchCompanies();
  } catch (err) {
    // DEBUG: Log the error
    console.error("❌ Company creation error:", err);
    setError((err as Error).message || "Failed to save company");
  } finally {
    setLoading(false);
  }
};
```

Then check the browser console (F12 → Console) for what data is being sent.

---

## Backend Debug: Add Exception Logging

**Edit: Backend/src/UabIndia.Api/Controllers/CompaniesController.cs**

Find the Create method (around line 138) and add error logging:

```csharp
[HttpPost]
[Authorize(Policy = "AdminOnly")]
public async Task<IActionResult> Create([FromBody] CreateCompanyDto dto)
{
    try
    {
        if (!ModelState.IsValid)
        {
            // DEBUG: Log model errors
            var errors = ModelState.Values.SelectMany(v => v.Errors);
            Console.WriteLine($"❌ ModelState Errors: {string.Join(", ", errors.Select(e => e.ErrorMessage))}");
            return BadRequest(ModelState);
        }

        var tenantId = _tenantAccessor.GetTenantId();

        // ... rest of create logic ...

        _db.Companies.Add(company);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Company created successfully", company });
    }
    catch (Exception ex)
    {
        // DEBUG: Log the exception
        Console.WriteLine($"❌ Exception creating company: {ex.Message}");
        Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
        
        // Return detailed error (only in Development)
        return StatusCode(500, new 
        { 
            message = "Error creating company",
            error = ex.Message,
            innerException = ex.InnerException?.Message
        });
    }
}
```

---

## Solution: What to Check

**In order of likelihood:**

1. **Financial Year Fields** (80% chance)
   - Check format being sent
   - Should be `"MM-DD"` like `"04-01"`

2. **DateTime Fields** (10% chance)
   - `FinancialYearStart` and `FinancialYearEnd` in DTO
   - Type mismatch between frontend and backend

3. **Special Characters** (5% chance)
   - HTML/SQL injection in input
   - Sanitizer might be failing

4. **Database Constraint** (5% chance)
   - Duplicate values
   - Foreign key constraint
   - Column length exceeded

---

## Next Steps

1. **Open DevTools (F12)** and look at the Network tab
2. **Check the response body** of the 500 error
3. **Share the error message** with me
4. **Check backend console** for exception details

---

**What to do now:**
1. Try creating a minimal company (just name)
2. Check browser Network tab for exact error
3. Check backend console for exception
4. Share both error messages with me

