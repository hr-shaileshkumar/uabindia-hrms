namespace UabIndia.Application.Interfaces
{
    public interface ITenantAccessor
    {
        void SetTenantId(System.Guid tenantId);
        System.Guid GetTenantId();
    }
}
