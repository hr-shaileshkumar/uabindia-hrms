# 🚀 Backend API Deployment Guide

**Date:** February 3, 2026  
**Issue:** api.uabindia.in not reachable  
**Status:** Backend not deployed yet

---

## Current Status

### ❌ api.uabindia.in
- **Status:** Not reachable
- **Reason:** Backend not deployed to this domain
- **DNS:** Likely not configured
- **Server:** No running instance

### ✅ localhost:5000
- **Status:** Works for local testing
- **Requirement:** Backend running locally
- **Access:** Only from your machine

---

## Solution: Deploy Backend to api.uabindia.in

### Option 1: Azure Container Instances (Recommended)

#### Step 1: Build Docker Image

```bash
cd c:\Users\hp\Desktop\HRMS\Backend\src\UabIndia.Api

# Build production image
docker build -f Dockerfile.prod -t hrms-api:1.0.0 .

# Tag for GitHub Container Registry
docker tag hrms-api:1.0.0 ghcr.io/uabindia/hrms-api:1.0.0
docker tag hrms-api:1.0.0 ghcr.io/uabindia/hrms-api:latest
```

**Verify build succeeded:**
```bash
docker images | grep hrms-api

# Should show:
# ghcr.io/uabindia/hrms-api    1.0.0    xxxx    500MB
# ghcr.io/uabindia/hrms-api    latest   xxxx    500MB
```

#### Step 2: Push to Container Registry

```bash
# Login to GitHub Container Registry
$token = "your_github_token_here"
$token | docker login ghcr.io -u yourusername --password-stdin

# Push images
docker push ghcr.io/uabindia/hrms-api:1.0.0
docker push ghcr.io/uabindia/hrms-api:latest

# Verify
docker image ls | grep ghcr.io/uabindia
```

#### Step 3: Deploy to Azure

```powershell
# Set variables
$resourceGroup = "hrms-prod-rg"
$location = "eastus"
$containerGroup = "hrms-api-prod"
$image = "ghcr.io/uabindia/hrms-api:latest"
$dnsLabel = "api-uabindia"
$port = 5000

# Create resource group (if not exists)
az group create --name $resourceGroup --location $location

# Create container instance
az container create `
  --resource-group $resourceGroup `
  --name $containerGroup `
  --image $image `
  --cpu 2 `
  --memory 2 `
  --port $port `
  --dns-name-label $dnsLabel `
  --environment-variables `
    ASPNETCORE_ENVIRONMENT="Production" `
    Jwt__Issuer="https://api.uabindia.in" `
  --secure-environment-variables `
    "ConnectionStrings__DefaultConnection=Server=YOUR_DB_SERVER;Database=HRMS;User Id=sa;Password=YOUR_PASSWORD;" `
    "Jwt__Key=your-super-secret-key-min-32-characters-long-here" `
    "ApplicationInsights__InstrumentationKey=your-app-insights-key"

# Get the FQDN
az container show --resource-group $resourceGroup --name $containerGroup --query ipAddress.fqdn
# Output: api-uabindia.eastus.azurecontainers.io
```

**Output:** You'll get a URL like `api-uabindia.eastus.azurecontainers.io`

#### Step 4: Configure DNS (Point api.uabindia.in to Azure)

**Option A: Using Azure DNS**
```powershell
# Create DNS zone (if not exists)
az network dns zone create --resource-group $resourceGroup --name uabindia.in

# Create A record pointing to Azure container
az network dns record-set a create `
  --resource-group $resourceGroup `
  --zone-name uabindia.in `
  --name api

az network dns record-set a add-record `
  --resource-group $resourceGroup `
  --zone-name uabindia.in `
  --record-set-name api `
  --ipv4-address YOUR_AZURE_CONTAINER_IP

# Get the IP from Azure:
# az container show --resource-group $resourceGroup --name $containerGroup --query ipAddress.ip
```

**Option B: Using Domain Registrar (Godaddy, Namecheap, etc.)**
1. Log in to your domain registrar
2. Go to DNS settings
3. Add A record:
   - **Name:** api
   - **Type:** A
   - **Value:** YOUR_AZURE_CONTAINER_IP
4. Save and wait for DNS propagation (5-30 minutes)

#### Step 5: Set Up SSL/TLS (HTTPS)

**Option A: Azure Front Door (Handles SSL automatically)**
```powershell
# Create Front Door for SSL termination
az network front-door create `
  --name hrms-api-fd `
  --resource-group $resourceGroup `
  --backend-address api-uabindia.eastus.azurecontainers.io `
  --backend-host-header api-uabindia.eastus.azurecontainers.io

# Add custom domain
az network front-door frontend-endpoint create `
  --front-door-name hrms-api-fd `
  --resource-group $resourceGroup `
  --name api-endpoint `
  --host-name api.uabindia.in
```

**Option B: Let's Encrypt + nginx (Manual)**
```bash
# Install nginx on container
apt-get update && apt-get install -y nginx certbot python3-certbot-nginx

# Get certificate
certbot certonly --standalone -d api.uabindia.in

# Configure nginx as reverse proxy
cat > /etc/nginx/sites-available/api.uabindia.in << EOF
server {
    listen 443 ssl;
    server_name api.uabindia.in;
    
    ssl_certificate /etc/letsencrypt/live/api.uabindia.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.uabindia.in/privkey.pem;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

nginx -s reload
```

#### Step 6: Test Deployment

```bash
# Test health endpoint
curl https://api.uabindia.in/health

# Expected response (200):
# {
#   "status": "Healthy",
#   "checks": {
#     "Database": "Healthy",
#     "ApplicationInsights": "Healthy"
#   }
# }

# Test API is reachable
curl -I https://api.uabindia.in/health

# Should show:
# HTTP/2 200
# Content-Type: application/json
```

---

### Option 2: Azure App Service (Alternative)

```powershell
# Create App Service Plan
az appservice plan create `
  --name hrms-api-plan `
  --resource-group $resourceGroup `
  --sku B2 `
  --is-linux

# Create Web App
az webapp create `
  --resource-group $resourceGroup `
  --plan hrms-api-plan `
  --name hrms-api-prod `
  --deployment-container-image-name ghcr.io/uabindia/hrms-api:latest

# Configure app settings
az webapp config appsettings set `
  --resource-group $resourceGroup `
  --name hrms-api-prod `
  --settings `
    ASPNETCORE_ENVIRONMENT=Production `
    Jwt__Issuer=https://api.uabindia.in

# Map custom domain
az webapp config hostname add `
  --resource-group $resourceGroup `
  --webapp-name hrms-api-prod `
  --hostname api.uabindia.in
```

---

### Option 3: Local Testing First (Recommended)

If you don't have Azure set up yet, test locally first:

**Step 1: Start Backend Locally**
```bash
cd c:\Users\hp\Desktop\HRMS\Backend\src\UabIndia.Api
dotnet run
```

**Step 2: Update Frontend Config** (temporary)

Edit [frontend-next/next.config.ts](frontend-next/next.config.ts):
```typescript
destination: "http://localhost:5000/api/:path*",  // Use local backend
```

**Step 3: Test Login**
```bash
cd c:\Users\hp\Desktop\HRMS\frontend-next
npm run dev
```

Visit: http://localhost:3000/login

**Step 4: Verify Login Works Locally**
- Enter credentials
- Should login successfully
- No "cannot reach" errors

---

## Why api.uabindia.in is Not Reachable

| Reason | Status | Fix |
|--------|--------|-----|
| Backend not deployed | ✅ This is the issue | Deploy to Azure or another hosting |
| DNS not configured | ✅ Likely also an issue | Configure DNS to point to server IP |
| Server not running | ✅ Certain | Start the server/container |
| Firewall blocking | Possible | Allow port 5000/443 in firewall |
| SSL certificate missing | Likely | Use Azure Front Door or Let's Encrypt |

---

## Deployment Checklist

### Before Deployment
- [ ] Backend code compiles: `dotnet build` ✅ (verified today)
- [ ] All tests pass: `dotnet test` ✅ (16/16 passing)
- [ ] Docker image builds: `docker build -f Dockerfile.prod .`
- [ ] Database migration completed
- [ ] Environment variables ready (DB connection, JWT key, etc.)

### Deployment Steps
- [ ] Build Docker image
- [ ] Push to container registry
- [ ] Create Azure resources (container group or app service)
- [ ] Configure environment variables
- [ ] Configure DNS (point api.uabindia.in to Azure IP)
- [ ] Set up SSL/TLS certificate
- [ ] Configure CORS in backend

### Post-Deployment
- [ ] Test health endpoint: `curl https://api.uabindia.in/health`
- [ ] Test login endpoint: `curl -X POST https://api.uabindia.in/api/v1/auth/login`
- [ ] Check Application Insights for errors
- [ ] Test frontend login with production API
- [ ] Monitor error rates

---

## Environment Variables Needed

Create these in Azure Key Vault or pass as environment variables:

```powershell
$env:ConnectionStrings__DefaultConnection = "Server=YOUR_DB_SERVER;Database=HRMS;User Id=sa;Password=YOUR_PASSWORD;"
$env:Jwt__Key = "your-super-secret-key-min-32-characters-long-here-2024"
$env:Jwt__Issuer = "https://api.uabindia.in"
$env:Jwt__Audience = "hrms-api-clients"
$env:ApplicationInsights__InstrumentationKey = "YOUR_APP_INSIGHTS_KEY"
$env:ASPNETCORE_ENVIRONMENT = "Production"
$env:Cors__AllowedOrigins = "https://hrms.uabindia.in,https://app.uabindia.in"
```

---

## Quick Deployment (10 minutes with prerequisites)

```powershell
# 1. Build image
docker build -f Dockerfile.prod -t ghcr.io/uabindia/hrms-api:latest .

# 2. Push
docker push ghcr.io/uabindia/hrms-api:latest

# 3. Deploy to Azure
az container create --resource-group hrms-prod-rg --name hrms-api-prod `
  --image ghcr.io/uabindia/hrms-api:latest --cpu 2 --memory 2 --port 5000 `
  --dns-name-label api-uabindia `
  --environment-variables ASPNETCORE_ENVIRONMENT=Production

# 4. Get FQDN
az container show --resource-group hrms-prod-rg --name hrms-api-prod `
  --query ipAddress.fqdn

# 5. Configure DNS in your domain registrar
# Point api.uabindia.in → [FQDN from step 4]

# 6. Test
curl https://api.uabindia.in/health
```

---

## Troubleshooting Deployment

| Issue | Solution |
|-------|----------|
| "Cannot reach api.uabindia.in" | Deploy backend to Azure or another server |
| "Connection refused" after deployment | Check container is running: `az container list` |
| "Timeout" | Check firewall allows port 5000/443 |
| "SSL certificate error" | Use Azure Front Door or set up Let's Encrypt |
| "Bad Gateway" | Check backend URL in nginx/Front Door config |
| "CORS error" | Configure backend CORS to allow frontend domain |

---

## Next Steps

### Recommended Path:
1. **Test locally first** (5 min) - Verify login works with localhost backend
2. **Set up Azure resources** (15 min) - Container instance or App Service
3. **Deploy backend** (5 min) - Push Docker image and create container
4. **Configure DNS** (5-30 min) - Point api.uabindia.in to Azure IP
5. **Test production** (10 min) - Verify login works with api.uabindia.in

### Alternative (If no Azure access):
1. Use local backend for testing: `dotnet run` on localhost:5000
2. Update frontend to point to localhost
3. Test full login flow
4. Deploy to cloud when ready

---

## References

- [DEPLOYMENT_OPERATIONS_MANUAL.md](DEPLOYMENT_OPERATIONS_MANUAL.md) - Complete operations guide
- [Dockerfile.prod](Backend/src/UabIndia.Api/Dockerfile.prod) - Production container configuration
- [docker-compose.yml](docker-compose.yml) - Local development setup
- [next.config.ts](frontend-next/next.config.ts) - Frontend API configuration

---

**Status:** API not deployed yet  
**Solution:** Deploy backend to api.uabindia.in using steps above  
**Timeline:** 30-45 minutes with prerequisites ready  
**Priority:** High (needed for production)

---

**Last Updated:** February 3, 2026  
**Next Action:** Choose deployment option and follow steps
