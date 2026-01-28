using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Middleware
{
    public class TenantResolverMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IMemoryCache _cache;

        public TenantResolverMiddleware(RequestDelegate next, IMemoryCache cache)
        {
            _next = next;
            _cache = cache;
        }

        public async Task Invoke(HttpContext context, ITenantAccessor tenantAccessor, ApplicationDbContext db)
        {
            // Allow explicit tenant override via header for local/dev testing
            if (context.Request.Headers.TryGetValue("X-Tenant", out var headerTenant) && !string.IsNullOrWhiteSpace(headerTenant))
            {
                // Accept either a tenant GUID or a subdomain string
                if (Guid.TryParse(headerTenant, out var guid))
                {
                    tenantAccessor.SetTenantId(guid);
                    await _next(context);
                    return;
                }

                // treat header as subdomain and resolve
                var tenantFromHeader = await db.Tenants.FirstOrDefaultAsync(t => t.Subdomain == headerTenant);
                if (tenantFromHeader != null)
                {
                    tenantAccessor.SetTenantId(tenantFromHeader.Id);
                    await _next(context);
                    return;
                }

                context.Response.StatusCode = 404;
                await context.Response.WriteAsync("Tenant not found");
                return;
            }

            var host = context.Request.Host.Host; // e.g. company.uabtech.in or tenant.localhost
            var subdomain = ExtractSubdomain(host);
            if (string.IsNullOrWhiteSpace(subdomain))
            {
                context.Response.StatusCode = 400;
                await context.Response.WriteAsync("Tenant subdomain missing");
                return;
            }

            var cacheKey = $"tenant_{subdomain}";
            var tenant = await _cache.GetOrCreateAsync(cacheKey, async entry =>
            {
                entry.SlidingExpiration = System.TimeSpan.FromMinutes(30);
                return await db.Tenants.FirstOrDefaultAsync(t => t.Subdomain == subdomain);
            });

            if (tenant == null)
            {
                context.Response.StatusCode = 404;
                await context.Response.WriteAsync("Tenant not found");
                return;
            }

            tenantAccessor.SetTenantId(tenant.Id);
            await _next(context);
        }

        private string? ExtractSubdomain(string host)
        {
            if (string.IsNullOrWhiteSpace(host)) return null;
            var parts = host.Split('.');
            // Accept tenant.localhost (2 parts) for local development AND tenant.example.com (3+ parts)
            if (parts.Length >= 2)
            {
                return parts[0];
            }
            return null;
        }
    }
}
