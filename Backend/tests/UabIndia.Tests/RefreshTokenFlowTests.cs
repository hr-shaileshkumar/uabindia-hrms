using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;
using UabIndia.Api.Controllers;
using UabIndia.Application.Interfaces;
using UabIndia.Identity.Services;
using UabIndia.Core.Entities;

namespace UabIndia.Tests
{
    public class RefreshTokenFlowTests
    {
        private JwtService BuildJwt()
        {
            var cfg = new ConfigurationBuilder().AddInMemoryCollection().Build();
            cfg["Jwt:Key"] = "01234567890123456789012345678901"; // 32 chars = 256 bits
            cfg["Jwt:Issuer"] = "test";
            cfg["Jwt:Audience"] = "test";
            return new JwtService(cfg);
        }

        [Fact]
        public async Task Rotation_Succeeds_Returns_NewTokens()
        {
            var tenantId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var deviceId = "device-1";

            var refreshSvc = new RefreshTokenService();
            var oldToken = refreshSvc.GenerateRefreshToken();
            var oldHash = refreshSvc.HashToken(oldToken);

            var existing = new RefreshToken { Id = Guid.NewGuid(), TenantId = tenantId, UserId = userId, TokenHash = oldHash, DeviceId = deviceId, ExpiresAt = DateTime.UtcNow.AddDays(30), IsRevoked = false };

            var repoMock = new Mock<IRefreshTokenRepository>();
            repoMock.Setup(r => r.GetByHashAsync(tenantId, userId, oldHash)).ReturnsAsync(existing);
            // when saving new token, do nothing; GetByHashAsync for new hash will return a new record via callback
            repoMock.Setup(r => r.SaveRefreshTokenAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<DateTime>())).Returns(Task.CompletedTask);
            repoMock.Setup(r => r.GetByHashAsync(tenantId, userId, It.IsAny<string>())).ReturnsAsync((Guid t, Guid u, string h) =>
            {
                if (h == oldHash) return existing;
                return new RefreshToken { Id = Guid.NewGuid(), TenantId = tenantId, UserId = userId, TokenHash = h, DeviceId = deviceId, ExpiresAt = DateTime.UtcNow.AddDays(30), IsRevoked = false } as RefreshToken;
            });

            var tenantAccessor = new Mock<ITenantAccessor>();
            tenantAccessor.Setup(t => t.GetTenantId()).Returns(tenantId);

            var jwt = BuildJwt();
            var controller = new AuthController(jwt, refreshSvc, repoMock.Object, tenantAccessor.Object);

            var req = new AuthController.RefreshRequest { RefreshToken = oldToken, UserId = userId, DeviceId = deviceId };
            var res = await controller.Refresh(req);

            Assert.IsType<OkObjectResult>(res);
        }

        [Fact]
        public async Task DeviceMismatch_RevokesToken_And_Returns_Unauthorized()
        {
            var tenantId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var existingDevice = "device-1";
            var requestDevice = "device-2";

            var refreshSvc = new RefreshTokenService();
            var oldToken = refreshSvc.GenerateRefreshToken();
            var oldHash = refreshSvc.HashToken(oldToken);

            var existing = new RefreshToken { Id = Guid.NewGuid(), TenantId = tenantId, UserId = userId, TokenHash = oldHash, DeviceId = existingDevice, ExpiresAt = DateTime.UtcNow.AddDays(30), IsRevoked = false };

            var repoMock = new Mock<IRefreshTokenRepository>();
            repoMock.Setup(r => r.GetByHashAsync(tenantId, userId, oldHash)).ReturnsAsync(existing);
            repoMock.Setup(r => r.UpdateRefreshTokenAsync(It.IsAny<RefreshToken>())).Returns(Task.CompletedTask).Verifiable();

            var tenantAccessor = new Mock<ITenantAccessor>();
            tenantAccessor.Setup(t => t.GetTenantId()).Returns(tenantId);

            var jwt = BuildJwt();
            var controller = new AuthController(jwt, refreshSvc, repoMock.Object, tenantAccessor.Object);

            var req = new AuthController.RefreshRequest { RefreshToken = oldToken, UserId = userId, DeviceId = requestDevice };
            var res = await controller.Refresh(req);

            Assert.IsType<UnauthorizedResult>(res);
            repoMock.Verify(r => r.UpdateRefreshTokenAsync(It.Is<RefreshToken>(rt => rt.IsRevoked == true)), Times.AtLeastOnce);
        }

        [Fact]
        public async Task ReplayDetection_RevokesAllAndReturns_Unauthorized()
        {
            var tenantId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var deviceId = "device-1";

            var refreshSvc = new RefreshTokenService();
            var oldToken = refreshSvc.GenerateRefreshToken();
            var oldHash = refreshSvc.HashToken(oldToken);

            var existing = new RefreshToken { Id = Guid.NewGuid(), TenantId = tenantId, UserId = userId, TokenHash = oldHash, DeviceId = deviceId, ExpiresAt = DateTime.UtcNow.AddDays(30), IsRevoked = true };

            var repoMock = new Mock<IRefreshTokenRepository>();
            repoMock.Setup(r => r.GetByHashAsync(tenantId, userId, oldHash)).ReturnsAsync(existing);
            repoMock.Setup(r => r.RevokeAllForUserAsync(tenantId, userId)).Returns(Task.CompletedTask).Verifiable();

            var tenantAccessor = new Mock<ITenantAccessor>();
            tenantAccessor.Setup(t => t.GetTenantId()).Returns(tenantId);

            var jwt = BuildJwt();
            var controller = new AuthController(jwt, refreshSvc, repoMock.Object, tenantAccessor.Object);

            var req = new AuthController.RefreshRequest { RefreshToken = oldToken, UserId = userId, DeviceId = deviceId };
            var res = await controller.Refresh(req);

            Assert.IsType<UnauthorizedResult>(res);
            repoMock.Verify(r => r.RevokeAllForUserAsync(tenantId, userId), Times.Once);
        }
    }
}
