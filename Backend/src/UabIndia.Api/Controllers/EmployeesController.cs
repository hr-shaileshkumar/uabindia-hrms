using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Infrastructure.Data;
using UabIndia.Api.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;

namespace UabIndia.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
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

            var employee = new Employee
            {
                FullName = dto.FullName,
                EmployeeCode = dto.EmployeeCode,
                ProjectId = dto.ProjectId,
                TenantId = _tenantAccessor.GetTenantId(),
                CreatedAt = DateTime.UtcNow
            };

            _db.Employees.Add(employee);
            await _db.SaveChangesAsync();

            var result = new EmployeeDto { Id = employee.Id, FullName = employee.FullName, EmployeeCode = employee.EmployeeCode, ProjectId = employee.ProjectId };
            return CreatedAtAction(nameof(Get), new { id = employee.Id }, result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var emp = await _db.Employees.FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId && !e.IsDeleted);
            if (emp == null) return NotFound();
            var res = new EmployeeDto { Id = emp.Id, FullName = emp.FullName, EmployeeCode = emp.EmployeeCode, ProjectId = emp.ProjectId };
            return Ok(res);
        }
    }
}
