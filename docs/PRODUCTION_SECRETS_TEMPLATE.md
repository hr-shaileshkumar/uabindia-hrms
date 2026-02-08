# Production Secrets Template (Fill & Lock)

## JWT
- Jwt__Key=
- Jwt__Issuer=uabindia
- Jwt__Audience=uabindia_clients
- AccessTokenMinutes=15
- RefreshTokenDays=30

## Database
- ConnectionStrings__DefaultConnection=

## CORS
- Cors__AllowedOrigins__0=
- Cors__AllowedOrigins__1=

## Rate Limiting
- RateLimit__PermitLimit=100
- RateLimit__WindowSeconds=60

## Logging/Monitoring
- Logging__LogLevel__Default=Information
- Logging__LogLevel__Microsoft=Warning
- Logging__LogLevel__Microsoft.Hosting.Lifetime=Information

## Storage/Artifacts (if used)
- Storage__Provider=
- Storage__ConnectionString=

## Misc
- ASPNETCORE_ENVIRONMENT=Production
- ASPNETCORE_URLS=https://+:443;http://+:80
