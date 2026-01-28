using System;
using System.ComponentModel.DataAnnotations;

namespace UabIndia.Api.Models
{
    public class AttendancePunchDto
    {
        [Required]
        public Guid EmployeeId { get; set; }
        [Required]
        public DateTime Timestamp { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public string? DeviceId { get; set; }
        public string? Source { get; set; }
    }
}
