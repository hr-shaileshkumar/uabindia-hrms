using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize(Policy = "AdminOnly")]
    [Authorize(Policy = "Module:platform")]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IPasswordHasher<User> _hasher;

        public UsersController(ApplicationDbContext db, ITenantAccessor tenantAccessor, IPasswordHasher<User> hasher)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _hasher = hasher;
        }

        [HttpGet]
        public async Task<IActionResult> List()
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var users = await _db.Users
                .AsNoTracking()
                .Where(u => u.TenantId == tenantId)
                .ToListAsync();

            var roles = await _db.Roles.AsNoTracking().Where(r => r.TenantId == tenantId).ToListAsync();
            var userRoles = await _db.UserRoles.AsNoTracking().Where(ur => ur.TenantId == tenantId).ToListAsync();

            var data = users.Select(u => new UserDto
            {
                Id = u.Id,
                Email = u.Email,
                FullName = u.FullName,
                IsActive = u.IsActive,
                Roles = userRoles.Where(ur => ur.UserId == u.Id)
                    .Join(roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
                    .ToArray()
            });

            return Ok(data);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();
            var exists = await _db.Users.AnyAsync(u => u.TenantId == tenantId && u.Email == dto.Email);
            if (exists) return BadRequest(new { message = "User already exists." });

            var user = new User
            {
                Email = dto.Email,
                FullName = dto.FullName,
                IsActive = dto.IsActive,
                TenantId = tenantId
            };

            user.PasswordHash = _hasher.HashPassword(user, dto.Password);

            _db.Users.Add(user);

            if (dto.Roles?.Length > 0)
            {
                var roles = await _db.Roles.Where(r => r.TenantId == tenantId && dto.Roles.Contains(r.Name)).ToListAsync();
                foreach (var role in roles)
                {
                    _db.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id, TenantId = tenantId });
                }
            }

            await _db.SaveChangesAsync();

            return Ok(new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                IsActive = user.IsActive,
                Roles = dto.Roles ?? Array.Empty<string>()
            });
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserDto dto)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id && u.TenantId == tenantId);
            if (user == null) return NotFound();

            if (!string.IsNullOrWhiteSpace(dto.FullName)) user.FullName = dto.FullName;
            if (dto.IsActive.HasValue) user.IsActive = dto.IsActive.Value;
            if (!string.IsNullOrWhiteSpace(dto.Password))
            {
                user.PasswordHash = _hasher.HashPassword(user, dto.Password);
            }

            if (dto.Roles != null)
            {
                var existing = _db.UserRoles.Where(ur => ur.TenantId == tenantId && ur.UserId == id);
                _db.UserRoles.RemoveRange(existing);
                var roles = await _db.Roles.Where(r => r.TenantId == tenantId && dto.Roles.Contains(r.Name)).ToListAsync();
                foreach (var role in roles)
                {
                    _db.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id, TenantId = tenantId });
                }
            }

            await _db.SaveChangesAsync();
            return Ok();
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id && u.TenantId == tenantId);
            if (user == null) return NotFound();

            user.IsDeleted = true;
            await _db.SaveChangesAsync();
            return Ok();
        }
    }
}
