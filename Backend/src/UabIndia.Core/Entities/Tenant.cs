using System;

namespace UabIndia.Core.Entities
{
    public class Tenant : BaseEntity
    {
        public string? Subdomain { get; set; }
        public string? Name { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
