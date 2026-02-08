using System;
using System.Threading.Tasks;

namespace UabIndia.Application.Interfaces
{
    public interface IRefreshTokenRepository
    {
        Task SaveRefreshTokenAsync(Guid tenantId, Guid userId, string tokenHash, string deviceId, DateTime expiresAt);
        Task<bool> ValidateRefreshTokenAsync(Guid tenantId, Guid userId, string tokenHash);
        Task<Core.Entities.RefreshToken?> GetByHashAsync(Guid tenantId, Guid userId, string tokenHash);
        Task<Core.Entities.RefreshToken?> GetByHashAsync(Guid tenantId, string tokenHash);
        Task UpdateRefreshTokenAsync(Core.Entities.RefreshToken token);
        Task RevokeRefreshTokenAsync(Guid tenantId, Guid userId, string tokenHash);
        Task RevokeAllForUserAsync(Guid tenantId, Guid userId);
    }
}
