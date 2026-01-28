using Microsoft.EntityFrameworkCore;
using UabIndia.Core.Entities;
using UabIndia.Application.Interfaces;

namespace UabIndia.Infrastructure.Data
{
    public class ApplicationDbContext : DbContext
    {
        private readonly ITenantAccessor _tenantAccessor;

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, ITenantAccessor tenantAccessor)
            : base(options)
        {
            _tenantAccessor = tenantAccessor;
        }

        public DbSet<Tenant> Tenants { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Employee> Employees { get; set; }
        public DbSet<AttendanceRecord> AttendanceRecords { get; set; }
        public DbSet<AttendanceCorrection> AttendanceCorrections { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Apply global query filter for multi-tenant + soft delete
            modelBuilder.Entity<BaseEntity>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantAccessor.GetTenantId());

            // Decimal precision for geo coordinates to match SQL schema
            modelBuilder.Entity<AttendanceRecord>().Property(a => a.Latitude).HasPrecision(10,7);
            modelBuilder.Entity<AttendanceRecord>().Property(a => a.Longitude).HasPrecision(10,7);

            // configure Tenant entity keys etc. (omitted brevity)
        }

        public override int SaveChanges()
        {
            // set tenant and audit fields
            foreach (var entry in ChangeTracker.Entries<BaseEntity>())
            {
                if (entry.State == EntityState.Added)
                {
                    entry.Entity.TenantId = _tenantAccessor.GetTenantId();
                    entry.Entity.CreatedAt = System.DateTime.UtcNow;
                }
                else if (entry.State == EntityState.Modified)
                {
                    entry.Entity.UpdatedAt = System.DateTime.UtcNow;
                }
            }

            return base.SaveChanges();
        }
    }

    // Domain entities are defined in UabIndia.Core.Entities
}
