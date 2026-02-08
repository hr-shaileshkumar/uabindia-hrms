using System;

namespace UabIndia.Core.Entities
{
    public class Payslip : BaseEntity
    {
        public Guid PayrollRunId { get; set; }
        public Guid EmployeeId { get; set; }
        public decimal Gross { get; set; }
        public decimal Net { get; set; }
        public string? Details { get; set; }
    }
}
