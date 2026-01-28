using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Infrastructure.Data;
using UabIndia.Core.Entities;
using UabIndia.Application.Interfaces;
using System;

namespace UabIndia.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
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

            var record = new AttendanceRecord
            {
                EmployeeId = dto.EmployeeId,
                Timestamp = dto.Timestamp,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                DeviceId = dto.DeviceId,
                Source = dto.Source,
                TenantId = _tenantAccessor.GetTenantId(),
                CreatedAt = DateTime.UtcNow
            };

            _db.AttendanceRecords.Add(record);
            await _db.SaveChangesAsync();

            return Ok(new { id = record.Id, geoValidated = record.GeoValidated });
        }
    }
}
