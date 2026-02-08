using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize(Policy = "AdminOnly")]
    [Authorize(Policy = "Module:platform")]
    public class AuditLogsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public AuditLogsController(ApplicationDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> List(
            [FromQuery] int page = 1,
            [FromQuery] int limit = 50,
            [FromQuery] string? entity = null,
            [FromQuery] string? action = null,
            [FromQuery] System.Guid? performedBy = null)
        {
            if (page < 1) page = 1;
            if (limit < 1) limit = 50;
            if (limit > 200) limit = 200;

            var query = _db.AuditLogs.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(entity))
            {
                query = query.Where(a => a.EntityName != null && EF.Functions.Like(a.EntityName, $"%{entity}%"));
            }

            if (!string.IsNullOrWhiteSpace(action))
            {
                query = query.Where(a => a.Action != null && EF.Functions.Like(a.Action, $"%{action}%"));
            }

            if (performedBy.HasValue)
            {
                query = query.Where(a => a.PerformedBy == performedBy.Value);
            }

            var total = await query.CountAsync();

            var data = await query
                .OrderByDescending(a => a.PerformedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(a => new AuditLogDto
                {
                    Id = a.Id,
                    EntityName = a.EntityName ?? string.Empty,
                    EntityId = a.EntityId,
                    Action = a.Action ?? string.Empty,
                    PerformedAt = a.PerformedAt,
                    PerformedBy = a.PerformedBy,
                    Ip = a.Ip
                })
                .ToListAsync();

            return Ok(new { logs = data, total, page, limit });
        }
    }
}
