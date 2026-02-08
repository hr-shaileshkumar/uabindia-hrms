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
    [Authorize]
    [Authorize(Policy = "Module:platform")]
    public class RolesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public RolesController(ApplicationDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> List()
        {
            var data = await _db.Roles
                .AsNoTracking()
                .Select(r => new RoleDto
                {
                    Id = r.Id,
                    Name = r.Name,
                    Description = r.Description
                })
                .OrderBy(r => r.Name)
                .ToListAsync();

            return Ok(new { roles = data });
        }
    }
}
