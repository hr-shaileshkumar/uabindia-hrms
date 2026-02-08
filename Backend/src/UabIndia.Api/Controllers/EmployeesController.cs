using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Infrastructure.Data;
using UabIndia.Api.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using Microsoft.AspNetCore.Authorization;

namespace UabIndia.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    [Authorize(Policy = "Module:hrms")]
    public class EmployeesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public EmployeesController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateEmployeeDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();
            var companyExists = await _db.Companies.AnyAsync(c => c.Id == dto.CompanyId && c.TenantId == tenantId && !c.IsDeleted);
            if (!companyExists) return BadRequest(new { message = "Invalid company." });

            var employee = new Employee
            {
                FullName = dto.FullName,
                EmployeeCode = dto.EmployeeCode,
                CompanyId = dto.CompanyId,
                ProjectId = dto.ProjectId,
                Status = dto.Status,
                TenantId = tenantId,
                CreatedAt = DateTime.UtcNow
            };

            _db.Employees.Add(employee);
            await _db.SaveChangesAsync();

            var result = new EmployeeDto { Id = employee.Id, FullName = employee.FullName, CompanyId = employee.CompanyId, EmployeeCode = employee.EmployeeCode, ProjectId = employee.ProjectId, Status = employee.Status };
            return CreatedAtAction(nameof(Get), new { id = employee.Id }, result);
        }

        [HttpGet]
        public async Task<IActionResult> List()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var data = await _db.Employees
                .AsNoTracking()
                .Where(e => e.TenantId == tenantId)
                .Select(e => new EmployeeDto
                {
                    Id = e.Id,
                    FullName = e.FullName,
                    CompanyId = e.CompanyId,
                    EmployeeCode = e.EmployeeCode,
                    ProjectId = e.ProjectId,
                    Status = e.Status
                })
                .ToListAsync();

            return Ok(data);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var emp = await _db.Employees.FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId && !e.IsDeleted);
            if (emp == null) return NotFound();
            var res = new EmployeeDto { Id = emp.Id, FullName = emp.FullName, CompanyId = emp.CompanyId, EmployeeCode = emp.EmployeeCode, ProjectId = emp.ProjectId, Status = emp.Status };
            return Ok(res);
        }
    }
}
