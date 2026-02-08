using UabIndia.Application.Interfaces;

namespace UabIndia.Infrastructure.Services
{
    public class TenantAccessor : ITenantAccessor
    {
        private System.Guid _tenantId = System.Guid.Empty;
        private string? _tenantSchema;

        public void SetTenantId(System.Guid tenantId)
        {
            _tenantId = tenantId;
        }

        public System.Guid GetTenantId() => _tenantId;

        public void SetTenantSchema(string? schema)
        {
            _tenantSchema = schema;
        }

        public string? GetTenantSchema() => _tenantSchema;
    }
}
