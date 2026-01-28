using System;
using System.ComponentModel.DataAnnotations;

namespace UabIndia.Api.Models
{
    public class CreateEmployeeDto
    {
        [Required]
        public string? FullName { get; set; }
        public string? EmployeeCode { get; set; }
        public Guid? ProjectId { get; set; }
    }

    public class EmployeeDto
    {
        public Guid Id { get; set; }
        public string? FullName { get; set; }
        public string? EmployeeCode { get; set; }
        public Guid? ProjectId { get; set; }
    }
}
