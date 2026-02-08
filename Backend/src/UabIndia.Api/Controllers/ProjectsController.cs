using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    [Authorize(Policy = "Module:platform")]
    public class ProjectsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public ProjectsController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] Guid? companyId)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.Projects
                .AsNoTracking()
                .Where(p => p.TenantId == tenantId && !p.IsDeleted);
            if (companyId.HasValue)
            {
                query = query.Where(p => p.CompanyId == companyId.Value);
            }

            var data = await (from p in query
                              join c in _db.Companies.AsNoTracking().Where(c => !c.IsDeleted) on p.CompanyId equals c.Id into pc
                              from c in pc.DefaultIfEmpty()
                              select new ProjectDto
                              {
                                  Id = p.Id,
                                  TenantId = p.TenantId,
                                  Name = p.Name,
                                  CompanyId = p.CompanyId,
                                  CompanyName = c != null ? c.Name : string.Empty,
                                  IsActive = p.IsActive
                              })
                .OrderBy(p => p.Name)
                .ToListAsync();

            return Ok(new { projects = data });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var project = await (from p in _db.Projects.AsNoTracking()
                                 join c in _db.Companies.AsNoTracking().Where(c => !c.IsDeleted) on p.CompanyId equals c.Id into pc
                                 from c in pc.DefaultIfEmpty()
                                 where p.Id == id && p.TenantId == tenantId && !p.IsDeleted
                                 select new ProjectDto
                                 {
                                     Id = p.Id,
                                     TenantId = p.TenantId,
                                     Name = p.Name,
                                     CompanyId = p.CompanyId,
                                     CompanyName = c != null ? c.Name : string.Empty,
                                     IsActive = p.IsActive
                                 })
                .FirstOrDefaultAsync();

            if (project == null) return NotFound();
            return Ok(new { project });
        }
    }
}
