using UabIndia.Application.Interfaces;

namespace UabIndia.Infrastructure.Services
{
    public class TenantAccessor : ITenantAccessor
    {
        private System.Guid _tenantId = System.Guid.Empty;

        public void SetTenantId(System.Guid tenantId)
        {
            _tenantId = tenantId;
        }

        public System.Guid GetTenantId() => _tenantId;
    }
}
