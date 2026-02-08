using System;

namespace UabIndia.Api.Models
{
    public class TenantDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Subdomain { get; set; } = string.Empty;
        public bool IsActive { get; set; }
    }

    public class CreateTenantDto
    {
        [System.ComponentModel.DataAnnotations.Required]
        [System.ComponentModel.DataAnnotations.StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.Required]
        [System.ComponentModel.DataAnnotations.StringLength(60)]
        public string Subdomain { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.Required]
        [System.ComponentModel.DataAnnotations.EmailAddress]
        [System.ComponentModel.DataAnnotations.StringLength(200)]
        public string AdminEmail { get; set; } = string.Empty;

        [System.ComponentModel.DataAnnotations.Required]
        [System.ComponentModel.DataAnnotations.StringLength(200, MinimumLength = 8)]
        public string AdminPassword { get; set; } = string.Empty;
    }

    public class UpdateTenantDto
    {
        [System.ComponentModel.DataAnnotations.StringLength(100)]
        public string? Name { get; set; }

        [System.ComponentModel.DataAnnotations.StringLength(60)]
        public string? Subdomain { get; set; }

        public bool? IsActive { get; set; }
    }

    public class CompanyDto
    {
        public Guid Id { get; set; }
        public Guid TenantId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? LegalName { get; set; }
        public string? Code { get; set; }
        public string? RegistrationNumber { get; set; }
        public string? TaxId { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? WebsiteUrl { get; set; }
        public string? LogoUrl { get; set; }
        public string? Industry { get; set; }
        public string? CompanySize { get; set; }
        public string? RegistrationAddress { get; set; }
        public string? OperationalAddress { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? PostalCode { get; set; }
        public string? Country { get; set; }
        public string? BankAccountNumber { get; set; }
        public string? BankName { get; set; }
        public string? BankBranch { get; set; }
        public string? IFSCCode { get; set; }
        public string? FinancialYearStart { get; set; }
        public string? FinancialYearEnd { get; set; }
        public int? MaxEmployees { get; set; }
        public string? ContactPersonName { get; set; }
        public string? ContactPersonPhone { get; set; }
        public string? ContactPersonEmail { get; set; }
        public string? HR_PersonName { get; set; }
        public string? HR_PersonEmail { get; set; }
        public string? Notes { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateCompanyDto
    {
        [System.ComponentModel.DataAnnotations.Required]
        public string Name { get; set; } = string.Empty;
        
        public string? LegalName { get; set; }
        public string? Code { get; set; }
        public string? RegistrationNumber { get; set; }
        public string? TaxId { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? WebsiteUrl { get; set; }
        public string? LogoUrl { get; set; }
        public string? Industry { get; set; }
        public string? CompanySize { get; set; }
        public string? RegistrationAddress { get; set; }
        public string? OperationalAddress { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? PostalCode { get; set; }
        public string? Country { get; set; }
        public string? BankAccountNumber { get; set; }
        public string? BankName { get; set; }
        public string? BankBranch { get; set; }
        public string? IFSCCode { get; set; }
        public string? FinancialYearStart { get; set; }
        public string? FinancialYearEnd { get; set; }
        public int? MaxEmployees { get; set; }
        public string? ContactPersonName { get; set; }
        public string? ContactPersonPhone { get; set; }
        public string? ContactPersonEmail { get; set; }
        public string? HR_PersonName { get; set; }
        public string? HR_PersonEmail { get; set; }
        public string? Notes { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class UpdateCompanyDto
    {
        public string? Name { get; set; }
        public string? LegalName { get; set; }
        public string? Code { get; set; }
        public string? RegistrationNumber { get; set; }
        public string? TaxId { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? WebsiteUrl { get; set; }
        public string? LogoUrl { get; set; }
        public string? Industry { get; set; }
        public string? CompanySize { get; set; }
        public string? RegistrationAddress { get; set; }
        public string? OperationalAddress { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? PostalCode { get; set; }
        public string? Country { get; set; }
        public string? BankAccountNumber { get; set; }
        public string? BankName { get; set; }
        public string? BankBranch { get; set; }
        public string? IFSCCode { get; set; }
        public string? FinancialYearStart { get; set; }
        public string? FinancialYearEnd { get; set; }
        public int? MaxEmployees { get; set; }
        public string? ContactPersonName { get; set; }
        public string? ContactPersonPhone { get; set; }
        public string? ContactPersonEmail { get; set; }
        public string? HR_PersonName { get; set; }
        public string? HR_PersonEmail { get; set; }
        public string? Notes { get; set; }
        public bool? IsActive { get; set; }
    }

    public class ProjectDto
    {
        public Guid Id { get; set; }
        public Guid TenantId { get; set; }
        public string Name { get; set; } = string.Empty;
        public Guid CompanyId { get; set; }
        public string? CompanyName { get; set; }
        public bool IsActive { get; set; }
    }

    public class RoleDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class ModuleCatalogDto
    {
        public string Key { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public bool IsEnabled { get; set; }
        public string Version { get; set; } = "0001";
    }

    public class TenantModuleDto
    {
        public string ModuleKey { get; set; } = string.Empty;
        public bool IsEnabled { get; set; }
    }

    public class UpdateTenantModulesDto
    {
        public TenantModuleDto[] Subscriptions { get; set; } = Array.Empty<TenantModuleDto>();
    }

    public class AuditLogDto
    {
        public Guid Id { get; set; }
        public string EntityName { get; set; } = string.Empty;
        public Guid? EntityId { get; set; }
        public string Action { get; set; } = string.Empty;
        public DateTime PerformedAt { get; set; }
        public Guid? PerformedBy { get; set; }
        public string? Ip { get; set; }
    }

    public class ApiKeyDto
    {
        public string Name { get; set; } = string.Empty;
        public string Prefix { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class IntegrationDto
    {
        public string Name { get; set; } = string.Empty;
        public string Status { get; set; } = "inactive";
    }

    public class DeviceSessionDto
    {
        public Guid Id { get; set; }
        public string DeviceId { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public bool IsRevoked { get; set; }
    }

    public class PasswordPolicyDto
    {
        public int MinLength { get; set; }
        public bool RequireUppercase { get; set; }
        public bool RequireLowercase { get; set; }
        public bool RequireNumber { get; set; }
        public bool RequireSpecial { get; set; }
        public int MaxAgeDays { get; set; }
    }
}
