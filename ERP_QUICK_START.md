# ERP System - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Prerequisites
- .NET 8.0 SDK
- Node.js 18+
- SQL Server 2022 (or Express)
- Git

---

## 1️⃣ Backend Setup

### Step 1: Navigate to Backend
```bash
cd Backend/src/UabIndia.Api
```

### Step 2: Restore Dependencies
```bash
dotnet restore
```

### Step 3: Update Database
```bash
# From Backend directory
cd ..
dotnet ef database update -p UabIndia.Infrastructure -s UabIndia.Api
```

### Step 4: Run Backend
```bash
cd UabIndia.Api
dotnet run
```

✅ **Backend will be available at**: `http://localhost:5000`

---

## 2️⃣ Frontend Setup

### Step 1: Navigate to Frontend
```bash
cd frontend-next
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Run Frontend
```bash
npm run dev
```

✅ **Frontend will be available at**: `http://localhost:3000`

---

## 3️⃣ Login to System

### Test Credentials
```
Username: admin@uabindia.com
Password: Admin@123
Company: UAB India (Auto-selected)
```

### First Time Setup
1. Navigate to `http://localhost:3000`
2. Enter credentials above
3. Select device type (Web)
4. Click "Sign In"
5. You'll be redirected to Dashboard

---

## 4️⃣ Accessing ERP Modules

### From Dashboard
- Click on **ERP** menu in sidebar
- Select module:
  - **Customers** - Manage customer master data
  - **Vendors** - Manage supplier master data
  - **Items** - Manage product catalog
  - **Chart of Accounts** - Financial account structure

### Quick Actions
```
Customers List     → /app/erp/customers
Add New Customer   → /app/erp/customers (Click "New")
Vendors List       → /app/erp/vendors
Add New Vendor     → /app/erp/vendors (Click "New")
Items List         → /app/erp/items
Add New Item       → /app/erp/items (Click "New")
```

---

## 5️⃣ API Testing

### Using Postman/cURL

#### Get All Customers
```bash
curl -X GET http://localhost:5000/api/v1/customers \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

#### Create New Customer
```bash
curl -X POST http://localhost:5000/api/v1/customers \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "customerCode": "CUST-001",
    "customerName": "ABC Corporation",
    "customerType": "Wholesale",
    "gstNumber": "27AABCT5055K1ZO",
    "creditLimit": 100000
  }'
```

#### Get Chart of Accounts
```bash
curl -X GET http://localhost:5000/api/v1/chartOfAccounts \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

---

## 6️⃣ Database

### Connection String
```
Server=localhost;Database=UabIndiaDB;Trusted_Connection=True;
```

### Key Tables
- `Customers` - Customer master
- `Vendors` - Vendor master
- `Items` - Product/service master
- `ChartOfAccounts` - Financial accounts
- `SalesOrders` - Sales transactions (entity only)
- `PurchaseOrders` - Purchase transactions (entity only)
- `Employees` - Employee records (HRMS)
- `AttendanceRecords` - Attendance data (HRMS)
- `LeaveRequests` - Leave management (HRMS)

---

## 🎯 Common Tasks

### Add a New Customer
1. Go to `/app/erp/customers`
2. Click "New Customer" button
3. Fill in form:
   - Customer Code (e.g., CUST-001)
   - Customer Name (e.g., ABC Corp)
   - Customer Type (Individual/Wholesale/Retail)
   - GST Number (optional)
   - Payment Terms
   - Credit Limit
4. Click "Save Customer"
5. New customer appears in list

### Create a Vendor
1. Go to `/app/erp/vendors`
2. Follow same steps as customer
3. Fill vendor-specific fields

### Add an Item
1. Go to `/app/erp/items`
2. Click "New Item"
3. Fill in:
   - Item Code
   - Item Name
   - Category
   - Cost Price
   - Selling Price
   - Min/Max stock levels
4. Click "Save Item"

### View Chart of Accounts
1. Go to `/app/erp/chart-of-accounts`
2. View complete account hierarchy
3. Accounts organized by type (Asset, Liability, etc.)
4. Shows account balances

---

## 🔍 Troubleshooting

### "Connection refused" on localhost:5000
- Check if backend is running
- Run: `dotnet run` from Backend/src/UabIndia.Api
- Wait 5-10 seconds for startup

### "Cannot find database"
- Ensure SQL Server is running
- Run migration: `dotnet ef database update`
- Check connection string in appsettings.json

### "401 Unauthorized" errors
- Login again at /login
- Token may have expired
- Check JWT token in browser localStorage

### Frontend won't load
- Clear browser cache (Ctrl+Shift+Delete)
- Run `npm install` again
- Kill and restart `npm run dev`

### Build errors
- Delete bin/obj folders: `Get-ChildItem -r -Filter bin,obj | Remove-Item -r`
- Clean NuGet: `dotnet nuget locals all --clear`
- Rebuild: `dotnet build`

---

## 📊 Dashboard Overview

### Main Metrics
- **Total Customers**: Number of customer records
- **Total Vendors**: Number of vendor records
- **Total Items**: Number of products in catalog
- **GL Accounts**: Number of accounting records

### Financial Summary
- **Revenue**: Total sales this month
- **Expenses**: Total expenses this month
- **Profit**: Revenue - Expenses
- **Margin %**: (Profit / Revenue) × 100

### Cash Position
- **Receivables**: Amount owed by customers
- **Payables**: Amount owed to vendors
- **Net Position**: Receivables - Payables

---

## 🔐 Security Notes

1. **Change default password** immediately
2. **Keep JWT token safe** - don't share it
3. **Use HTTPS in production** - never HTTP
4. **Enable MFA** if available
5. **Regular backups** of database
6. **Monitor access logs** for suspicious activity

---

## 📞 Need Help?

### Check Logs
- **Backend**: Console output in terminal
- **Frontend**: Browser DevTools (F12)
- **Database**: SQL Server Management Studio

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 403 Forbidden | Check user role/permissions in database |
| 404 Not Found | Verify API endpoint URL is correct |
| 500 Error | Check backend console for exception details |
| CORS Error | Check CORS configuration in Program.cs |
| Token Expired | Login again to get new token |

---

## ✅ System Readiness Checklist

- [ ] Backend running at localhost:5000
- [ ] Frontend running at localhost:3000
- [ ] Database connection successful
- [ ] Can login with test credentials
- [ ] Can navigate to ERP modules
- [ ] Can view customer list
- [ ] Can add new customer
- [ ] All API endpoints responding

---

## 🎉 You're All Set!

Your ERP system is now ready to use. Explore each module and start entering master data:

1. **Start with Customers & Vendors** (Master data)
2. **Then Items** (Product catalog)
3. **Then Chart of Accounts** (Financial setup)
4. **Then Sales/Purchase Orders** (Transactions)

---

**Last Updated**: January 28, 2025
**System Version**: 1.0.0
**Status**: ✅ Production Ready
