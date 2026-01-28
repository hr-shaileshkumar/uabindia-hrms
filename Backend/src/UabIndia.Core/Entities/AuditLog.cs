using System;

namespace UabIndia.Core.Entities
{
    public class AuditLog : BaseEntity
    {
        public string? EntityName { get; set; }
        public Guid EntityId { get; set; }
        public string? Action { get; set; }
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
        public Guid? PerformedBy { get; set; }
        public string? Ip { get; set; }
    }
}
