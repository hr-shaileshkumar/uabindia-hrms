using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace UabIndia.Api.Models
{
    public class WorkflowStepDto
    {
        public int StepOrder { get; set; }
        public string RoleRequired { get; set; } = string.Empty;
        public string ApprovalType { get; set; } = "Any";
        public int? EscalationDays { get; set; }
    }

    public class WorkflowDefinitionDto
    {
        public Guid Id { get; set; }
        public string ModuleKey { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public List<WorkflowStepDto> Steps { get; set; } = new();
    }

    public class UpsertWorkflowDefinitionDto
    {
        [Required]
        public string ModuleKey { get; set; } = string.Empty;
        [Required]
        public string Name { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public List<WorkflowStepDto> Steps { get; set; } = new();
    }

    public class CreateApprovalRequestDto
    {
        [Required]
        public string ModuleKey { get; set; } = string.Empty;
        [Required]
        public string EntityType { get; set; } = string.Empty;
        [Required]
        public Guid EntityId { get; set; }
        public string? Comments { get; set; }
    }

    public class ApprovalActionDto
    {
        public string? Comments { get; set; }
    }

    public class ApprovalRequestDto
    {
        public Guid Id { get; set; }
        public string ModuleKey { get; set; } = string.Empty;
        public string EntityType { get; set; } = string.Empty;
        public Guid EntityId { get; set; }
        public int CurrentStep { get; set; }
        public string Status { get; set; } = "Pending";
        public Guid RequestedBy { get; set; }
        public DateTime RequestedAt { get; set; }
        public Guid? ApprovedBy { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public Guid? RejectedBy { get; set; }
        public DateTime? RejectedAt { get; set; }
        public string? Comments { get; set; }
    }
}
