using System;

namespace UabIndia.Core.Entities
{
    public class Employee : BaseEntity
    {
        public Guid CompanyId { get; set; }
        public string? FullName { get; set; }
        public string? EmployeeCode { get; set; }
        public Guid? ProjectId { get; set; }
        public Guid? ManagerId { get; set; }
        public Guid? ReportingManagerId { get; set; }
        public Guid? UserId { get; set; }
        public string? Status { get; set; }
    }
}
