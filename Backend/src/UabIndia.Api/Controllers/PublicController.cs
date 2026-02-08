using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Api.Services;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Controllers
{
    [ApiController]
    [Route("api/v1/public")]
    [AllowAnonymous]
    public class PublicController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly InputSanitizer _sanitizer;

        public PublicController(ApplicationDbContext db, ITenantAccessor tenantAccessor, InputSanitizer sanitizer)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _sanitizer = sanitizer;
        }

        [HttpGet("company-profile")]
        public async Task<IActionResult> GetCompanyProfile()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return NotFound(new { message = "Tenant not resolved" });
            }

            var tenant = await _db.Tenants
                .AsNoTracking()
                .Where(t => t.Id == tenantId)
                .Select(t => new TenantDto
                {
                    Id = t.Id,
                    Name = t.Name ?? string.Empty,
                    Subdomain = t.Subdomain ?? string.Empty,
                    IsActive = t.IsActive
                })
                .FirstOrDefaultAsync();

            var company = await _db.Companies
                .AsNoTracking()
                .Where(c => c.TenantId == tenantId && c.IsActive && !c.IsDeleted)
                .OrderBy(c => c.CreatedAt)
                .Select(c => new PublicCompanyProfileDto
                {
                    Id = c.Id,
                    Name = c.Name ?? string.Empty,
                    LegalName = c.LegalName,
                    WebsiteUrl = c.WebsiteUrl,
                    LogoUrl = c.LogoUrl,
                    Industry = c.Industry,
                    CompanySize = c.CompanySize,
                    Email = c.Email,
                    PhoneNumber = c.PhoneNumber,
                    ContactPersonName = c.ContactPersonName,
                    ContactPersonEmail = c.ContactPersonEmail,
                    ContactPersonPhone = c.ContactPersonPhone,
                    HRPersonName = c.HR_PersonName,
                    HRPersonEmail = c.HR_PersonEmail,
                    City = c.City,
                    State = c.State,
                    Country = c.Country
                })
                .FirstOrDefaultAsync();

            var brandingJson = await _db.TenantConfigs
                .AsNoTracking()
                .Where(c => c.TenantId == tenantId)
                .Select(c => c.BrandingJson)
                .FirstOrDefaultAsync() ?? "{}";

            var response = new PublicCompanyProfileResponse
            {
                Tenant = tenant,
                Company = company,
                BrandingJson = brandingJson
            };

            return Ok(response);
        }

        [HttpPost("contact")]
        public async Task<IActionResult> SubmitContact([FromBody] PublicContactRequestDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return NotFound(new { message = "Tenant not resolved" });
            }

            var submission = new ContactSubmission
            {
                TenantId = tenantId,
                Name = _sanitizer.Sanitize(dto.Name) ?? dto.Name,
                Email = _sanitizer.Sanitize(dto.Email) ?? dto.Email,
                PhoneNumber = _sanitizer.Sanitize(dto.PhoneNumber),
                CompanyName = _sanitizer.Sanitize(dto.CompanyName),
                Subject = _sanitizer.Sanitize(dto.Subject),
                Message = _sanitizer.Sanitize(dto.Message) ?? dto.Message,
                Source = "public"
            };

            _db.ContactSubmissions.Add(submission);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Thanks for reaching out", id = submission.Id });
        }
    }
}
