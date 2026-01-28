using System;

namespace UabIndia.Core.Entities
{
    public class Employee : BaseEntity
    {
        public string? FullName { get; set; }
        public string? EmployeeCode { get; set; }
        public Guid? ProjectId { get; set; }
        public Guid? ManagerId { get; set; }
    }
}
