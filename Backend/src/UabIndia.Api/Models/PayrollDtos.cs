using System;
using System.ComponentModel.DataAnnotations;

namespace UabIndia.Api.Models
{
    // ===== PAYROLL STRUCTURE DTOs =====
    
    public class CreatePayrollStructureDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        [Required]
        public DateTime EffectiveFrom { get; set; }
        public DateTime? EffectiveTo { get; set; }
    }

    public class UpdatePayrollStructureDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        [Required]
        public DateTime EffectiveFrom { get; set; }
        public DateTime? EffectiveTo { get; set; }
    }

    // ===== PAYROLL COMPONENT DTOs =====

    public class CreatePayrollComponentDto
    {
        [Required]
        public Guid StructureId { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
        [Required]
        public string Type { get; set; } = "Earning"; // Earning or Deduction
        public decimal? Amount { get; set; }
        public decimal? Percentage { get; set; }
        public bool IsStatutory { get; set; }
    }

    public class UpdatePayrollComponentDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        [Required]
        public string Type { get; set; } = "Earning";
        public decimal? Amount { get; set; }
        public decimal? Percentage { get; set; }
        public bool IsStatutory { get; set; }
    }

    // ===== PAYROLL RUN DTOs =====

    public class PayrollRunDto
    {
        public Guid Id { get; set; }
        public Guid? CompanyId { get; set; }
        public DateTime RunDate { get; set; }
        public string Status { get; set; } = "Draft";
    }

    public class CreatePayrollRunDto
    {
        public Guid? CompanyId { get; set; }
        [Required]
        public DateTime RunDate { get; set; }
    }

    // ===== PAYSLIP DTOs =====

    public class PayslipDto
    {
        public Guid Id { get; set; }
        public Guid PayrollRunId { get; set; }
        public Guid EmployeeId { get; set; }
        public decimal Gross { get; set; }
        public decimal Net { get; set; }
        public string? Details { get; set; }
    }

    public class CreatePayslipDto
    {
        [Required]
        public Guid PayrollRunId { get; set; }
        [Required]
        public Guid EmployeeId { get; set; }
        [Required]
        public decimal Gross { get; set; }
        [Required]
        public decimal Net { get; set; }
        public string? Details { get; set; }
    }
}
