# ✅ Frontend API Configuration Complete

**Date:** February 3, 2026  
**Status:** ✅ Configuration Complete (API server deployment pending)

---

## What Was Completed

### 1. Next.js API Proxy Configuration ✅
**File:** [next.config.ts](next.config.ts)

**Change:**
```typescript
// BEFORE (localhost)
destination: "http://localhost:5000/api/:path*",

// AFTER (production API)
destination: "https://api.uabindia.in/api/:path*",
```

All API requests from the frontend are now proxied to `https://api.uabindia.in`

---

### 2. Environment Configuration Files Created ✅

**Created 3 files:**

**1. `.env.production`** - Production configuration
```bash
NEXT_PUBLIC_API_URL=https://api.uabindia.in
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_NAME=UAB India HRMS
NEXT_PUBLIC_ENVIRONMENT=production
```

**2. `.env.local`** - Local development (for testing with localhost)
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_NAME=UAB India HRMS
NEXT_PUBLIC_ENVIRONMENT=development
```

**3. `.env.example`** - Template for reference
```bash
NEXT_PUBLIC_API_URL=https://api.uabindia.in
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_NAME=UAB India HRMS
NEXT_PUBLIC_ENVIRONMENT=production
```

---

### 3. API Connection Guide Created ✅
**File:** [API_CONNECTION_GUIDE.md](API_CONNECTION_GUIDE.md)

Complete documentation covering:
- Request flow diagram
- Authentication flow
- Testing procedures
- CORS configuration requirements
- SSL/TLS requirements
- Troubleshooting guide
- Deployment checklist
- Security considerations

---

## Current Status

### ✅ Frontend Configuration
- Next.js proxy: **Configured** → `https://api.uabindia.in`
- Environment files: **Created** (.env.production, .env.local, .env.example)
- Documentation: **Complete** (API_CONNECTION_GUIDE.md)
- API client: **Ready** (apiClient.ts uses relative URLs)

### ⏳ API Server Status
- URL: `https://api.uabindia.in`
- Status: **Not reachable** (connection timeout)
- Health check: **Not responding**

**This means:**
- Frontend is properly configured ✅
- API server needs to be deployed to api.uabindia.in ⏳

---

## Next Steps to Complete Integration

### Option 1: Deploy Backend to api.uabindia.in (Recommended)

**Prerequisites:**
- Azure subscription or hosting provider
- Domain DNS configured (api.uabindia.in → Azure IP)
- SSL/TLS certificate for api.uabindia.in

**Deployment Steps:**

1. **Deploy Backend API to Azure Container Instances**
```bash
# Build Docker image
cd c:\Users\hp\Desktop\HRMS\Backend\src\UabIndia.Api
docker build -f Dockerfile.prod -t hrms-api:latest .

# Tag for registry
docker tag hrms-api:latest ghcr.io/uabindia/hrms-api:latest

# Push to GitHub Container Registry
docker push ghcr.io/uabindia/hrms-api:latest

# Deploy to Azure
az container create \
  --resource-group hrms-prod-rg \
  --name hrms-api-prod \
  --image ghcr.io/uabindia/hrms-api:latest \
  --dns-name-label api-uabindia \
  --ports 5000 443 \
  --cpu 2 --memory 2
```

2. **Configure DNS**
```bash
# Get Azure Container IP
az container show --resource-group hrms-prod-rg --name hrms-api-prod --query ipAddress.fqdn

# Add DNS A record: api.uabindia.in → Azure IP
```

3. **Configure SSL/TLS**
```bash
# Option A: Azure Front Door (handles SSL automatically)
az network front-door create --name hrms-api-fd --resource-group hrms-prod-rg

# Option B: Let's Encrypt + nginx reverse proxy
certbot certonly --standalone -d api.uabindia.in
```

4. **Update Backend CORS**

Edit `Backend/src/UabIndia.Api/Program.cs`:
```csharp
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
            "http://localhost:3000",           // Local dev
            "https://hrms.uabindia.in",        // Production frontend
            "https://app.uabindia.in"          // Alternative domain
        )
        .AllowCredentials()
        .AllowAnyHeader()
        .AllowAnyMethod();
    });
});
```

5. **Test Connection**
```bash
# Health check
curl https://api.uabindia.in/health

# Should return:
# { "status": "Healthy", "checks": { "Database": "Healthy", ... } }
```

---

### Option 2: Use Temporary API URL (For Testing)

If you have the API deployed elsewhere temporarily:

1. **Update next.config.ts**
```typescript
destination: "https://your-temp-api-url.azurewebsites.net/api/:path*",
```

2. **Update .env.production**
```bash
NEXT_PUBLIC_API_URL=https://your-temp-api-url.azurewebsites.net
```

3. **Ensure CORS allows localhost:3000**

---

### Option 3: Test with Local Backend (Development)

To test the frontend with local backend:

1. **Start local backend**
```bash
cd c:\Users\hp\Desktop\HRMS\Backend\src\UabIndia.Api
dotnet run
```

2. **Update next.config.ts temporarily**
```typescript
destination: "http://localhost:5000/api/:path*",
```

3. **Use .env.local** (already configured for localhost)

4. **Start frontend**
```bash
cd c:\Users\hp\Desktop\HRMS\frontend-next
npm run dev
```

5. **Test at http://localhost:3000**

---

## Verification Checklist

Once API is deployed to api.uabindia.in:

### Backend Verification
- [ ] Backend accessible at `https://api.uabindia.in`
- [ ] Health check responds: `curl https://api.uabindia.in/health`
- [ ] SSL certificate valid and trusted
- [ ] CORS includes frontend domain
- [ ] Database connection working

### Frontend Verification
- [ ] Build succeeds: `npm run build`
- [ ] Development server starts: `npm run dev`
- [ ] Login page loads at http://localhost:3000/login
- [ ] Can submit login form
- [ ] Network tab shows requests to `https://api.uabindia.in/api/v1/*`
- [ ] Authentication works (token received)
- [ ] Protected pages accessible after login

### Integration Testing
- [ ] Login flow works end-to-end
- [ ] Dashboard loads with data
- [ ] CRUD operations work (companies, employees)
- [ ] Logout works correctly
- [ ] Token refresh works
- [ ] No CORS errors in browser console
- [ ] No mixed content warnings

---

## Quick Reference

### Files Modified
1. ✅ `frontend-next/next.config.ts` - API proxy to api.uabindia.in
2. ✅ `frontend-next/.env.production` - Production environment variables
3. ✅ `frontend-next/.env.local` - Local development variables
4. ✅ `frontend-next/.env.example` - Environment template
5. ✅ `frontend-next/API_CONNECTION_GUIDE.md` - Complete documentation

### Current Configuration
- **API URL:** `https://api.uabindia.in`
- **Protocol:** HTTPS
- **Proxy:** Next.js rewrites
- **Auth:** JWT + HTTP-only cookies
- **CORS:** Requires backend configuration

### Test Commands
```bash
# Test API health (when deployed)
curl https://api.uabindia.in/health

# Test API login (when deployed)
curl -X POST https://api.uabindia.in/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@uabindia.com","password":"YourPassword","deviceId":"test"}'

# Build frontend
cd c:\Users\hp\Desktop\HRMS\frontend-next
npm run build

# Start frontend (production mode)
npm run start

# Start frontend (development mode)
npm run dev
```

---

## Summary

✅ **Frontend is fully configured to connect to api.uabindia.in**

**What's Ready:**
- Next.js proxy configuration ✅
- Environment variables ✅
- API client setup ✅
- Complete documentation ✅

**What's Needed:**
- Deploy backend API to api.uabindia.in ⏳
- Configure DNS for api.uabindia.in ⏳
- Set up SSL/TLS certificate ⏳
- Configure backend CORS ⏳

**To complete the integration, deploy the backend to api.uabindia.in using the steps in [DEPLOYMENT_OPERATIONS_MANUAL.md](../DEPLOYMENT_OPERATIONS_MANUAL.md).**

---

**Configuration Status:** ✅ COMPLETE  
**Integration Status:** ⏳ Pending API deployment  
**Ready for:** Local testing (with local backend) or production deployment (when API is live)

---

**Last Updated:** February 3, 2026  
**Next Action:** Deploy backend to api.uabindia.in or test with local backend
