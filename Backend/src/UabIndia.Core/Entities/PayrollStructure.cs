using System;

namespace UabIndia.Core.Entities
{
    public class PayrollStructure : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public DateTime EffectiveFrom { get; set; }
        public DateTime? EffectiveTo { get; set; }
    }
}
