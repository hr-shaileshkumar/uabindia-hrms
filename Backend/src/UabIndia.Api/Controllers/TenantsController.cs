using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Api.Services;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize(Policy = "Module:platform")]
    public class TenantsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly TenantProvisioningService _provisioningService;
        private readonly ILogger<TenantsController> _logger;

        public TenantsController(ApplicationDbContext db, TenantProvisioningService provisioningService, ILogger<TenantsController> logger)
        {
            _db = db;
            _provisioningService = provisioningService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> List()
        {
            var data = await _db.Tenants
                .AsNoTracking()
                .Select(t => new TenantDto
                {
                    Id = t.Id,
                    Name = t.Name ?? string.Empty,
                    Subdomain = t.Subdomain ?? string.Empty,
                    IsActive = t.IsActive
                })
                .OrderBy(t => t.Name)
                .ToListAsync();

            return Ok(new { tenants = data });
        }

        [AllowAnonymous]
        [HttpGet("resolve")]
        public async Task<IActionResult> Resolve([FromQuery] string subdomain)
        {
            if (string.IsNullOrWhiteSpace(subdomain))
            {
                return BadRequest(new { message = "Subdomain is required." });
            }

            var tenant = await _db.Tenants
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Subdomain == subdomain && !t.IsDeleted);

            if (tenant == null)
            {
                return NotFound(new { exists = false });
            }

            return Ok(new { exists = true, name = tenant.Name ?? string.Empty, isActive = tenant.IsActive });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTenantDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var tenant = await _provisioningService.CreateTenantAsync(dto);
                return Ok(new TenantDto
                {
                    Id = tenant.Id,
                    Name = tenant.Name ?? string.Empty,
                    Subdomain = tenant.Subdomain ?? string.Empty,
                    IsActive = tenant.IsActive
                });
            }
            catch (System.InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Failed to create tenant");
                return StatusCode(500, new { message = "Tenant provisioning failed.", detail = ex.Message });
            }
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(System.Guid id, [FromBody] UpdateTenantDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.Id == id);
            if (tenant == null) return NotFound(new { message = "Tenant not found." });

            try
            {
                if (!string.IsNullOrWhiteSpace(dto.Subdomain)
                    && !string.Equals(dto.Subdomain.Trim(), tenant.Subdomain, System.StringComparison.OrdinalIgnoreCase))
                {
                    await _provisioningService.RenameTenantSchemaAsync(tenant, dto.Subdomain.Trim());
                }

                if (!string.IsNullOrWhiteSpace(dto.Name))
                {
                    tenant.Name = dto.Name.Trim();
                }

                if (dto.IsActive.HasValue)
                {
                    tenant.IsActive = dto.IsActive.Value;
                }

                tenant.UpdatedAt = System.DateTime.UtcNow;
                await _db.SaveChangesAsync();

                return Ok(new TenantDto
                {
                    Id = tenant.Id,
                    Name = tenant.Name ?? string.Empty,
                    Subdomain = tenant.Subdomain ?? string.Empty,
                    IsActive = tenant.IsActive
                });
            }
            catch (System.InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Failed to update tenant");
                return StatusCode(500, new { message = "Tenant update failed.", detail = ex.Message });
            }
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(System.Guid id)
        {
            var tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.Id == id);
            if (tenant == null) return NotFound(new { message = "Tenant not found." });

            tenant.IsDeleted = true;
            tenant.IsActive = false;
            tenant.UpdatedAt = System.DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return NoContent();
        }
    }
}
