using System;
using System.ComponentModel.DataAnnotations;

namespace UabIndia.Api.Models
{
    public class PublicCompanyProfileDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? LegalName { get; set; }
        public string? WebsiteUrl { get; set; }
        public string? LogoUrl { get; set; }
        public string? Industry { get; set; }
        public string? CompanySize { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? ContactPersonName { get; set; }
        public string? ContactPersonEmail { get; set; }
        public string? ContactPersonPhone { get; set; }
        public string? HRPersonName { get; set; }
        public string? HRPersonEmail { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Country { get; set; }
    }

    public class PublicCompanyProfileResponse
    {
        public TenantDto? Tenant { get; set; }
        public PublicCompanyProfileDto? Company { get; set; }
        public string BrandingJson { get; set; } = "{}";
    }

    public class PublicContactRequestDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [StringLength(200)]
        public string Email { get; set; } = string.Empty;

        [Phone]
        [StringLength(30)]
        public string? PhoneNumber { get; set; }

        [StringLength(150)]
        public string? CompanyName { get; set; }

        [StringLength(150)]
        public string? Subject { get; set; }

        [Required]
        [StringLength(2000)]
        public string Message { get; set; } = string.Empty;
    }
}
