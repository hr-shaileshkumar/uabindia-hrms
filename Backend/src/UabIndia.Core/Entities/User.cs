using System;

namespace UabIndia.Core.Entities
{
    public class User : BaseEntity
    {
        public string? Email { get; set; }
        public string? PasswordHash { get; set; }
        public string? FullName { get; set; }
    }
}
