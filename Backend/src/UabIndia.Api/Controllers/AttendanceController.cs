using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Infrastructure.Data;
using UabIndia.Core.Entities;
using UabIndia.Application.Interfaces;
using System;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace UabIndia.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    [Authorize(Policy = "Module:hrms")]
    public class AttendanceController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public AttendanceController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        [HttpPost("punch")]
        public async Task<IActionResult> Punch([FromBody] AttendancePunchDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();
            var employeeExists = await _db.Employees.AnyAsync(e => e.Id == dto.EmployeeId && e.TenantId == tenantId && !e.IsDeleted);
            if (!employeeExists) return BadRequest(new { message = "Invalid employee." });

            var record = new AttendanceRecord
            {
                EmployeeId = dto.EmployeeId,
                ProjectId = dto.ProjectId,
                PunchType = dto.PunchType,
                Timestamp = dto.Timestamp,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                DeviceId = dto.DeviceId,
                Source = dto.Source,
                TenantId = tenantId,
                CreatedAt = DateTime.UtcNow
            };

            _db.AttendanceRecords.Add(record);
            await _db.SaveChangesAsync();

            return Ok(new { id = record.Id, geoValidated = record.GeoValidated });
        }

        [HttpGet]
        public async Task<IActionResult> List()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var data = await _db.AttendanceRecords
                .AsNoTracking()
                .Where(a => a.TenantId == tenantId)
                .OrderByDescending(a => a.Timestamp)
                .Select(a => new AttendanceRecordDto
                {
                    Id = a.Id,
                    EmployeeId = a.EmployeeId,
                    ProjectId = a.ProjectId,
                    PunchType = a.PunchType,
                    Timestamp = a.Timestamp
                })
                .ToListAsync();

            return Ok(data);
        }
    }
}
