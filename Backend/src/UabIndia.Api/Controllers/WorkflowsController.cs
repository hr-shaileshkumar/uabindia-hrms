using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize(Policy = "AdminOnly")]
    [Authorize(Policy = "Module:platform")]
    public class WorkflowsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public WorkflowsController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet("{moduleKey}")]
        public async Task<IActionResult> GetByModule(string moduleKey)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var workflow = await _db.WorkflowDefinitions
                .Include(w => w.Steps)
                .FirstOrDefaultAsync(w => w.ModuleKey == moduleKey && w.TenantId == tenantId);

            if (workflow == null) return Ok(null);

            var result = new WorkflowDefinitionDto
            {
                Id = workflow.Id,
                ModuleKey = workflow.ModuleKey,
                Name = workflow.Name,
                IsActive = workflow.IsActive,
                Steps = workflow.Steps
                    .OrderBy(s => s.StepOrder)
                    .Select(s => new WorkflowStepDto
                    {
                        StepOrder = s.StepOrder,
                        RoleRequired = s.RoleRequired,
                        ApprovalType = s.ApprovalType,
                        EscalationDays = s.EscalationDays
                    })
                    .ToList()
            };

            return Ok(result);
        }

        [HttpPut]
        public async Task<IActionResult> Upsert([FromBody] UpsertWorkflowDefinitionDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var tenantId = _tenantAccessor.GetTenantId();
            var existing = await _db.WorkflowDefinitions
                .Include(w => w.Steps)
                .FirstOrDefaultAsync(w => w.ModuleKey == dto.ModuleKey && w.TenantId == tenantId);

            if (existing == null)
            {
                existing = new WorkflowDefinition
                {
                    TenantId = tenantId,
                    ModuleKey = dto.ModuleKey
                };
                _db.WorkflowDefinitions.Add(existing);
            }

            existing.Name = dto.Name;
            existing.IsActive = dto.IsActive;

            // Replace steps
            if (existing.Steps.Any())
            {
                _db.WorkflowSteps.RemoveRange(existing.Steps);
            }

            foreach (var step in dto.Steps.OrderBy(s => s.StepOrder))
            {
                existing.Steps.Add(new WorkflowStep
                {
                    TenantId = tenantId,
                    StepOrder = step.StepOrder,
                    RoleRequired = step.RoleRequired,
                    ApprovalType = step.ApprovalType,
                    EscalationDays = step.EscalationDays
                });
            }

            await _db.SaveChangesAsync();
            return Ok();
        }
    }
}
