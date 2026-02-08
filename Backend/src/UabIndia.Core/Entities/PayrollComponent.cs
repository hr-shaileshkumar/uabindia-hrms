using System;

namespace UabIndia.Core.Entities
{
    public class PayrollComponent : BaseEntity
    {
        public Guid StructureId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = "Earning";
        public decimal? Amount { get; set; }
        public decimal? Percentage { get; set; }
        public bool IsStatutory { get; set; }
    }
}
