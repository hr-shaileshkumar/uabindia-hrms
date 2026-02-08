using System;
using System.ComponentModel.DataAnnotations;

namespace UabIndia.Api.Models
{
    public class CreateUserDto
    {
        [Required]
        public string Email { get; set; } = string.Empty;
        [Required]
        public string Password { get; set; } = string.Empty;
        public string? FullName { get; set; }
        public string[] Roles { get; set; } = Array.Empty<string>();
        public bool IsActive { get; set; } = true;
    }

    public class UpdateUserDto
    {
        public string? FullName { get; set; }
        public bool? IsActive { get; set; }
        public string? Password { get; set; }
        public string[]? Roles { get; set; }
    }

    public class UserDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string? FullName { get; set; }
        public bool IsActive { get; set; }
        public string[] Roles { get; set; } = Array.Empty<string>();
    }
}
