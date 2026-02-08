using System;

namespace UabIndia.Core.Entities
{
    public class Project : BaseEntity
    {
        public Guid CompanyId { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
    }
}
