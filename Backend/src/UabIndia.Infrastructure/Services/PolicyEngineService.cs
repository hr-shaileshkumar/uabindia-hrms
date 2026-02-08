using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Services;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class PolicyEngineService : IPolicyEngine
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly ILogger<PolicyEngineService> _logger;

        public PolicyEngineService(ApplicationDbContext db, ITenantAccessor tenantAccessor, ILogger<PolicyEngineService> logger)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _logger = logger;
        }

        public async Task<PolicyDecision> EvaluateAsync(PolicyContext context)
        {
            var tenantId = context.TenantId == Guid.Empty ? _tenantAccessor.GetTenantId() : context.TenantId;
            var config = await _db.TenantConfigs
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.TenantId == tenantId);

            if (config == null || string.IsNullOrWhiteSpace(config.ConfigJson))
            {
                return Allow("No policy config");
            }

            try
            {
                using var doc = JsonDocument.Parse(config.ConfigJson);
                if (!doc.RootElement.TryGetProperty("policies", out var policies) || policies.ValueKind != JsonValueKind.Array)
                {
                    return Allow("No policies defined");
                }

                var matches = new List<JsonElement>();
                foreach (var policy in policies.EnumerateArray())
                {
                    var resource = policy.GetProperty("resource").GetString();
                    var action = policy.GetProperty("action").GetString();

                    if (!string.Equals(resource, context.Resource, StringComparison.OrdinalIgnoreCase))
                        continue;
                    if (!string.Equals(action, context.Action, StringComparison.OrdinalIgnoreCase))
                        continue;

                    matches.Add(policy);
                }

                if (matches.Count == 0)
                {
                    return Allow("No matching policy");
                }

                foreach (var policy in matches)
                {
                    if (!policy.TryGetProperty("roles", out var rolesElement) || rolesElement.ValueKind != JsonValueKind.Array)
                        continue;

                    var allowedRoles = rolesElement.EnumerateArray()
                        .Select(r => r.GetString())
                        .Where(r => !string.IsNullOrWhiteSpace(r))
                        .ToList();

                    if (!allowedRoles.Any(r => context.Roles.Contains(r, StringComparer.OrdinalIgnoreCase)))
                        continue;

                    if (policy.TryGetProperty("scope", out var scopeElement))
                    {
                        var scope = scopeElement.GetString();
                        if (string.Equals(scope, "self", StringComparison.OrdinalIgnoreCase))
                        {
                            if (!context.UserId.HasValue || !context.TargetUserId.HasValue || context.UserId != context.TargetUserId)
                            {
                                return Deny("Self-scope policy requires matching user context");
                            }
                        }
                    }

                    return Allow("Policy matched");
                }

                return Deny("No policy matched user roles");
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Invalid policy JSON in tenant config");
                return Allow("Invalid policy config");
            }
        }

        private static PolicyDecision Allow(string reason) => new PolicyDecision { Allowed = true, Reason = reason };

        private static PolicyDecision Deny(string reason) => new PolicyDecision { Allowed = false, Reason = reason };
    }
}
