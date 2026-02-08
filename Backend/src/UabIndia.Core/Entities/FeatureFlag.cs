using System;

namespace UabIndia.Core.Entities
{
    public class FeatureFlag : BaseEntity
    {
        public string FeatureKey { get; set; } = string.Empty;
        public bool IsEnabled { get; set; }
    }
}
