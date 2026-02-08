# Company Master API Testing Script
# Run this after starting the API server with: dotnet run

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   COMPANY MASTER API - TEST SUITE" -ForegroundColor Cyan  
Write-Host "========================================`n" -ForegroundColor Cyan

Start-Sleep -Seconds 2

# Test 1: Login
Write-Host "[Test 1] Login..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@uabindia.in"
    password = "Admin@123"
} | ConvertTo-Json

try {
    $authResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $authResponse.token
    Write-Host "  ✓ Login successful" -ForegroundColor Green
    Write-Host "    User: $($authResponse.user.email)" -ForegroundColor Gray
    Write-Host "    Token: $($token.Substring(0, 40))..." -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Test 2: List Companies (Initial - should be empty or minimal)
Write-Host "`n[Test 2] List Companies (GET /companies)..." -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $token" }
    $listResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/companies?page=1&limit=10" -Method GET -Headers $headers
    Write-Host "  ✓ List endpoint working" -ForegroundColor Green
    Write-Host "    Total companies: $($listResponse.total)" -ForegroundColor Gray
    Write-Host "    Page: $($listResponse.page), Limit: $($listResponse.limit)" -ForegroundColor Gray
    
    if ($listResponse.companies) {
        Write-Host "    Existing companies:" -ForegroundColor Gray
        foreach ($company in $listResponse.companies) {
            Write-Host "      - $($company.name) (ID: $($company.id))" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "  ✗ List failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Create New Company
Write-Host "`n[Test 3] Create Company (POST /companies)..." -ForegroundColor Yellow
$newCompany = @{
    name = "UAB Test Company"
    legalName = "UAB Test Company Private Limited"
    code = "UABTEST001"
    industry = "IT Services"
    companySize = "Large"
    maxEmployees = 500
    registrationNumber = "U72900DL2024PTC400001"
    taxId = "27AABCU1234K1Z5"
    email = "info@uabtest.com"
    phoneNumber = "+91 9876543210"
    websiteUrl = "https://www.uabtest.com"
    registrationAddress = "123 Business Park, Sector 62, Noida"
    operationalAddress = "456 Tech Plaza, Whitefield, Bangalore"
    city = "Bangalore"
    state = "Karnataka"
    postalCode = "560066"
    country = "India"
    bankAccountNumber = "50100098765432"
    bankName = "HDFC Bank"
    bankBranch = "Whitefield Main Branch"
    ifscCode = "HDFC0001234"
    financialYearStart = "04-01"
    financialYearEnd = "03-31"
    contactPersonName = "Rajesh Kumar"
    contactPersonPhone = "+91 9123456789"
    contactPersonEmail = "rajesh@uabtest.com"
    hr_PersonName = "Priya Singh"
    hr_PersonEmail = "priya.hr@uabtest.com"
    notes = "Test company for Company Master implementation - Feb 2026"
    isActive = $true
} | ConvertTo-Json

try {
    $headers = @{ 
        Authorization = "Bearer $token"
        "Content-Type" = "application/json"
    }
    $createResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/companies" -Method POST -Body $newCompany -Headers $headers
    $companyId = $createResponse.company.id
    Write-Host "  ✓ Company created successfully" -ForegroundColor Green
    Write-Host "    ID: $companyId" -ForegroundColor Gray
    Write-Host "    Name: $($createResponse.company.name)" -ForegroundColor Gray
    Write-Host "    Code: $($createResponse.company.code)" -ForegroundColor Gray
    Write-Host "    Email: $($createResponse.company.email)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Create failed: $($_.Exception.Message)" -ForegroundColor Red
    $companyId = $null
}

# Test 4: Get Single Company by ID
if ($companyId) {
    Write-Host "`n[Test 4] Get Company by ID (GET /companies/$companyId)..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $token" }
        $getResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/companies/$companyId" -Method GET -Headers $headers
        Write-Host "  ✓ Retrieved company successfully" -ForegroundColor Green
        Write-Host "    Name: $($getResponse.company.name)" -ForegroundColor Gray
        Write-Host "    Legal Name: $($getResponse.company.legalName)" -ForegroundColor Gray
        Write-Host "    City: $($getResponse.company.city)" -ForegroundColor Gray
        Write-Host "    Bank: $($getResponse.company.bankName)" -ForegroundColor Gray
        Write-Host "    Contact: $($getResponse.company.contactPersonName)" -ForegroundColor Gray
    } catch {
        Write-Host "  ✗ Get by ID failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 5: Update Company
if ($companyId) {
    Write-Host "`n[Test 5] Update Company (PUT /companies/$companyId)..." -ForegroundColor Yellow
    $updateData = @{
        email = "updated@uabtest.com"
        phoneNumber = "+91 9876543299"
        maxEmployees = 600
        notes = "Updated test company - Email and phone changed"
    } | ConvertTo-Json
    
    try {
        $headers = @{ 
            Authorization = "Bearer $token"
            "Content-Type" = "application/json"
        }
        $updateResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/companies/$companyId" -Method PUT -Body $updateData -Headers $headers
        Write-Host "  ✓ Company updated successfully" -ForegroundColor Green
        Write-Host "    New Email: $($updateResponse.company.email)" -ForegroundColor Gray
        Write-Host "    New Phone: $($updateResponse.company.phoneNumber)" -ForegroundColor Gray
        Write-Host "    Max Employees: $($updateResponse.company.maxEmployees)" -ForegroundColor Gray
    } catch {
        Write-Host "  ✗ Update failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 6: List Companies Again (should show the new company)
Write-Host "`n[Test 6] List Companies Again (verify creation)..." -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $token" }
    $listResponse2 = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/companies?page=1&limit=10" -Method GET -Headers $headers
    Write-Host "  ✓ List endpoint working" -ForegroundColor Green
    Write-Host "    Total companies: $($listResponse2.total)" -ForegroundColor Gray
    
    if ($listResponse2.companies) {
        Write-Host "    Companies:" -ForegroundColor Gray
        foreach ($company in $listResponse2.companies) {
            Write-Host "      - $($company.name) | Code: $($company.code) | City: $($company.city)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "  ✗ List failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Delete Company (Soft Delete)
if ($companyId) {
    Write-Host "`n[Test 7] Delete Company (DELETE /companies/$companyId)..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $token" }
        $deleteResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/companies/$companyId" -Method DELETE -Headers $headers
        Write-Host "  ✓ Company deleted successfully" -ForegroundColor Green
        Write-Host "    Message: $($deleteResponse.message)" -ForegroundColor Gray
    } catch {
        Write-Host "  ✗ Delete failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 8: Verify Deletion (should not appear in list)
Write-Host "`n[Test 8] List Companies After Delete (verify soft delete)..." -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $token" }
    $listResponse3 = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/companies?page=1&limit=10" -Method GET -Headers $headers
    Write-Host "  ✓ List endpoint working" -ForegroundColor Green
    Write-Host "    Total companies: $($listResponse3.total)" -ForegroundColor Gray
    
    $deletedCompanyFound = $false
    if ($listResponse3.companies) {
        foreach ($company in $listResponse3.companies) {
            if ($company.id -eq $companyId) {
                $deletedCompanyFound = $true
            }
        }
    }
    
    if (-not $deletedCompanyFound) {
        Write-Host "    ✓ Deleted company NOT in list (soft delete working)" -ForegroundColor Green
    } else {
        Write-Host "    ✗ Deleted company still appears in list!" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ List failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   TEST SUITE COMPLETE!" -ForegroundColor Cyan  
Write-Host "========================================`n" -ForegroundColor Cyan
