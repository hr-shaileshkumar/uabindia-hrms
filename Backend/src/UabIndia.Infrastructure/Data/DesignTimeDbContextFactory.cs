using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using System.IO;

namespace UabIndia.Infrastructure.Data
{
    public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
    {
        public ApplicationDbContext CreateDbContext(string[] args)
        {
            var builder = new DbContextOptionsBuilder<ApplicationDbContext>();

            // locate appsettings.Development.json in Api project
            var basePath = Path.Combine(Directory.GetCurrentDirectory(), "..", "UabIndia.Api");
            var config = new ConfigurationBuilder()
                .SetBasePath(basePath)
                .AddJsonFile("appsettings.Development.json", optional: true)
                .Build();

            var conn = config.GetConnectionString("DefaultConnection") ?? "Server=(localdb)\\MSSQLLocalDB;Database=UabIndia_HRMS;Trusted_Connection=True;";
            builder.UseSqlServer(conn);

            return new ApplicationDbContext(builder.Options, new Services.TenantAccessor());
        }
    }
}
