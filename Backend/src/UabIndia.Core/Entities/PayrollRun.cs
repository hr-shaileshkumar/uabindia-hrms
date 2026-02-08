using System;

namespace UabIndia.Core.Entities
{
    public class PayrollRun : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public DateTime RunDate { get; set; }
        public string Status { get; set; } = "Draft";
    }
}
