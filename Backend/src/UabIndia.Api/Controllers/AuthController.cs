using Microsoft.AspNetCore.Mvc;
using UabIndia.Identity.Services;
using System;

namespace UabIndia.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly JwtService _jwt;
        private readonly RefreshTokenService _refresh;
        private readonly UabIndia.Application.Interfaces.IRefreshTokenRepository _refreshRepo;
        private readonly UabIndia.Application.Interfaces.ITenantAccessor _tenantAccessor;

        public AuthController(JwtService jwt, RefreshTokenService refresh, UabIndia.Application.Interfaces.IRefreshTokenRepository refreshRepo, UabIndia.Application.Interfaces.ITenantAccessor tenantAccessor)
        {
            _jwt = jwt;
            _refresh = refresh;
            _refreshRepo = refreshRepo;
            _tenantAccessor = tenantAccessor;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // NOTE: replace with real user validation
            if (req.Email != "admin@demo" || req.Password != "Password123") return Unauthorized(new { message = "Invalid credentials" });

            var userId = Guid.NewGuid();
            var tenantId = _tenantAccessor.GetTenantId();
            var access = _jwt.GenerateToken(userId, tenantId, new string[]{"Admin"}, TimeSpan.FromMinutes(15));
            var refresh = _refresh.GenerateRefreshToken();
            var hash = _refresh.HashToken(refresh);
            var expires = DateTime.UtcNow.AddDays(30);
            await _refreshRepo.SaveRefreshTokenAsync(tenantId, userId, hash, req.DeviceId, expires);

            return Ok(new { access_token = access, refresh_token = refresh, expires_in = 900 });
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] RefreshRequest req)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (string.IsNullOrWhiteSpace(req.RefreshToken) || req.UserId == Guid.Empty) return BadRequest();

            var tenantId = _tenantAccessor.GetTenantId();
            var userId = req.UserId;
            var presentedHash = _refresh.HashToken(req.RefreshToken);
            // load token record
            var existing = await _refreshRepo.GetByHashAsync(tenantId, userId, presentedHash);
            if (existing == null)
            {
                // token doesn't exist
                return Unauthorized();
            }

            if (existing.IsRevoked)
            {
                // possible replay: revoke all tokens for user and require re-login
                await _refreshRepo.RevokeAllForUserAsync(tenantId, userId);
                return Unauthorized();
            }

            // enforce device binding
            if (!string.Equals(existing.DeviceId, req.DeviceId, StringComparison.Ordinal))
            {
                // device mismatch - revoke this token and deny
                existing.IsRevoked = true;
                existing.RevokedAt = DateTime.UtcNow;
                await _refreshRepo.UpdateRefreshTokenAsync(existing);
                return Unauthorized();
            }

            // rotate: mark existing revoked and create new token linked to parent
            existing.IsRevoked = true;
            existing.RevokedAt = DateTime.UtcNow;
            var newRefresh = _refresh.GenerateRefreshToken();
            var newHash = _refresh.HashToken(newRefresh);
            var newExpires = DateTime.UtcNow.AddDays(30);

            // save new token
            await _refreshRepo.SaveRefreshTokenAsync(tenantId, userId, newHash, req.DeviceId, newExpires);

            // link existing -> new (update existing.ReplacedByTokenId after new saved)
            // find the new record by hash to get its Id
            var newRecord = await _refreshRepo.GetByHashAsync(tenantId, userId, newHash);
            if (newRecord != null)
            {
                existing.ReplacedByTokenId = newRecord.Id;
                existing.ParentTokenId = existing.ParentTokenId ?? null;
                await _refreshRepo.UpdateRefreshTokenAsync(existing);
                newRecord.ParentTokenId = existing.Id;
                await _refreshRepo.UpdateRefreshTokenAsync(newRecord);
            }

            var newAccess = _jwt.GenerateToken(userId, tenantId, new string[]{"User"}, TimeSpan.FromMinutes(15));
            return Ok(new { access_token = newAccess, refresh_token = newRefresh, expires_in = 900 });
        }

        [HttpPost("revoke-all")]
        public async Task<IActionResult> RevokeAll([FromBody] RevokeAllRequest req)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var tenantId = _tenantAccessor.GetTenantId();
            await _refreshRepo.RevokeAllForUserAsync(tenantId, req.UserId);
            return Ok();
        }

        public class LoginRequest { public string? Email { get; set; } public string? Password { get; set; } [System.ComponentModel.DataAnnotations.Required] public string DeviceId { get; set; } }
        public class RefreshRequest { [System.ComponentModel.DataAnnotations.Required] public string RefreshToken { get; set; } public Guid UserId { get; set; } [System.ComponentModel.DataAnnotations.Required] public string DeviceId { get; set; } }
        public class RevokeAllRequest { [System.ComponentModel.DataAnnotations.Required] public Guid UserId { get; set; } }
    }
}
