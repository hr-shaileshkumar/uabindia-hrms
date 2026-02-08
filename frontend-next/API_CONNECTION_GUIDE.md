# Frontend API Configuration Guide

**Updated:** February 3, 2026  
**Status:** ✅ Connected to api.uabindia.in

---

## API Connection Status

### Production API
- **URL:** `https://api.uabindia.in`
- **Protocol:** HTTPS
- **Status:** ✅ Configured

### Configuration Files

**1. Next.js Proxy Configuration** ([next.config.ts](next.config.ts))
```typescript
async rewrites() {
  return [
    {
      source: "/api/:path*",
      destination: "https://api.uabindia.in/api/:path*",
    },
  ];
}
```

**2. Environment Variables**

- `.env.production` - Production API (api.uabindia.in)
- `.env.local` - Local development (localhost:5000)
- `.env.example` - Template for reference

---

## How It Works

### Request Flow
```
Frontend (localhost:3000 or deployed)
    ↓
    GET/POST /api/v1/auth/login
    ↓
Next.js Proxy Rewrite
    ↓
    https://api.uabindia.in/api/v1/auth/login
    ↓
Backend API Server
```

### Authentication Flow
1. User submits credentials via login form
2. Frontend sends POST to `/api/v1/auth/login`
3. Next.js rewrites to `https://api.uabindia.in/api/v1/auth/login`
4. Backend validates credentials
5. Backend returns JWT access token + sets HTTP-only refresh token cookie
6. Frontend stores access token in localStorage
7. Subsequent requests include `Authorization: Bearer {token}` header

---

## Testing the Connection

### 1. Health Check
```bash
curl https://api.uabindia.in/health
```

Expected response:
```json
{
  "status": "Healthy",
  "checks": {
    "Database": "Healthy",
    "ApplicationInsights": "Healthy"
  }
}
```

### 2. Login Test
```bash
curl -X POST https://api.uabindia.in/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@uabindia.com",
    "password": "YourPassword123",
    "deviceId": "test-device"
  }'
```

Expected response:
```json
{
  "accessToken": "eyJhbGci...",
  "user": {
    "id": 1,
    "email": "admin@uabindia.com",
    "tenantId": 1,
    ...
  }
}
```

### 3. Frontend Connection Test

Start development server:
```bash
npm run dev
```

Navigate to:
- http://localhost:3000/login
- Enter credentials
- Check browser console for API requests
- Verify requests go to `https://api.uabindia.in/api/v1/*`

---

## Environment Configuration

### Development (Local API)
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_ENVIRONMENT=development
```

Update [next.config.ts](next.config.ts):
```typescript
destination: "http://localhost:5000/api/:path*",
```

### Staging
```bash
# .env.staging
NEXT_PUBLIC_API_URL=https://api-staging.uabindia.in
NEXT_PUBLIC_ENVIRONMENT=staging
```

Update [next.config.ts](next.config.ts):
```typescript
destination: "https://api-staging.uabindia.in/api/:path*",
```

### Production (Current)
```bash
# .env.production
NEXT_PUBLIC_API_URL=https://api.uabindia.in
NEXT_PUBLIC_ENVIRONMENT=production
```

Update [next.config.ts](next.config.ts):
```typescript
destination: "https://api.uabindia.in/api/:path*",
```

---

## CORS Configuration

### Backend Requirements

The backend API must have CORS configured to allow requests from the frontend domain.

**Backend Configuration** ([Program.cs](../Backend/src/UabIndia.Api/Program.cs)):
```csharp
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
            "http://localhost:3000",           // Local development
            "https://hrms.uabindia.in",        // Production frontend
            "https://app.uabindia.in"          // Alternative domain
        )
        .AllowCredentials()
        .AllowAnyHeader()
        .AllowAnyMethod();
    });
});
```

### Allowed Origins
- `http://localhost:3000` - Local development
- `https://hrms.uabindia.in` - Production frontend
- `https://app.uabindia.in` - Alternative production domain

---

## SSL/TLS Configuration

### Production Requirements
- ✅ API must be served over HTTPS (api.uabindia.in)
- ✅ Valid SSL/TLS certificate (Let's Encrypt, DigiCert, etc.)
- ✅ TLS 1.2 or 1.3 minimum
- ✅ Secure cipher suites

### Certificate Validation
```bash
# Check SSL certificate
curl -vI https://api.uabindia.in/health 2>&1 | grep "SSL certificate"
```

---

## Troubleshooting

### Issue: "Failed to fetch" or CORS Error

**Cause:** Backend CORS not configured or frontend origin not whitelisted

**Solution:**
1. Check backend CORS configuration includes frontend domain
2. Verify backend is running and accessible
3. Check browser console for specific CORS error

### Issue: "Network Error" or "ERR_CONNECTION_REFUSED"

**Cause:** API server not reachable

**Solution:**
1. Verify API is running: `curl https://api.uabindia.in/health`
2. Check firewall rules allow HTTPS (port 443)
3. Verify DNS resolution: `nslookup api.uabindia.in`

### Issue: "401 Unauthorized" on all requests

**Cause:** Authentication token not being sent or invalid

**Solution:**
1. Check localStorage for `access_token`
2. Verify token is included in Authorization header
3. Try logging in again to get fresh token

### Issue: "Mixed Content" warning in browser

**Cause:** Frontend served over HTTPS but API calls using HTTP

**Solution:**
1. Ensure API URL uses `https://` not `http://`
2. Update [next.config.ts](next.config.ts) destination to HTTPS
3. Update `.env.production` to use HTTPS

---

## Deployment Checklist

### Before Deploying Frontend

- [ ] Backend API is deployed and accessible at `https://api.uabindia.in`
- [ ] Backend health check responds: `curl https://api.uabindia.in/health`
- [ ] Backend CORS includes frontend domain in allowed origins
- [ ] SSL/TLS certificate is valid and trusted
- [ ] Environment variables configured in `.env.production`
- [ ] [next.config.ts](next.config.ts) points to production API URL
- [ ] Test login flow with real credentials
- [ ] Verify JWT tokens are being set correctly
- [ ] Check browser console for errors

### Build for Production
```bash
# Install dependencies
npm install

# Build production bundle
npm run build

# Test production build locally
npm run start

# Verify it connects to https://api.uabindia.in
```

### Deploy to Production
```bash
# Option 1: Vercel
vercel --prod

# Option 2: Azure Static Web Apps
az staticwebapp create --name hrms-frontend --resource-group hrms-prod-rg

# Option 3: Docker
docker build -t hrms-frontend:latest .
docker run -p 3000:3000 hrms-frontend:latest
```

---

## API Endpoints Available

### Authentication
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Refresh access token

### HRMS
- `GET /api/v1/companies` - Get companies
- `POST /api/v1/companies` - Create company
- `GET /api/v1/employees` - Get employees
- `POST /api/v1/employees` - Create employee
- `GET /api/v1/attendance` - Get attendance records
- `POST /api/v1/attendance` - Record attendance

### Platform
- `GET /api/v1/modules/enabled` - Get enabled modules
- `GET /api/v1/modules/catalog` - Get module catalog

### Health & Monitoring
- `GET /health` - Comprehensive health check
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe

---

## Security Considerations

### HTTPS Enforcement
- All API requests use HTTPS in production
- HTTP Strict Transport Security (HSTS) enabled on backend
- No mixed content warnings

### Token Security
- Access tokens stored in localStorage (short-lived: 15 min)
- Refresh tokens stored in HTTP-only cookies (7 days)
- JWT tokens validated on every request
- Tokens cleared on logout

### CORS Protection
- Only whitelisted origins can make API requests
- Credentials (cookies) only sent to trusted domains
- Preflight requests handled correctly

### Input Validation
- All user input sanitized on backend
- XSS protection via Content Security Policy
- CSRF protection via Origin validation

---

## Monitoring & Logging

### Application Insights
- All API requests logged
- Performance metrics tracked
- Error rates monitored
- User activity tracked

### Health Checks
- Periodic health checks every 30 seconds
- Alerts triggered if API becomes unavailable
- Automatic failover to backup region (if configured)

---

## Support & Contacts

**Technical Issues:**
- Email: support@uabindia.com
- Portal: https://support.hrms.uabindia.in

**API Status:**
- Status Page: https://status.uabindia.in
- Health Check: https://api.uabindia.in/health

**Documentation:**
- API Docs: https://api.uabindia.in/swagger
- Frontend Docs: [README.md](README.md)
- Deployment Guide: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

---

**Last Updated:** February 3, 2026  
**Configuration:** Production (api.uabindia.in)  
**Status:** ✅ Active
