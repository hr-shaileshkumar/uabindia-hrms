using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Services;
using UabIndia.Api.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Configuration
var configuration = builder.Configuration;

// Ensure JWT secrets are provided via configuration or environment variables
string? jwtKey = configuration["Jwt:Key"];
string? jwtIssuer = configuration["Jwt:Issuer"];
string? jwtAudience = configuration["Jwt:Audience"];
if (string.IsNullOrWhiteSpace(jwtKey))
{
    jwtKey = Environment.GetEnvironmentVariable("Jwt__Key") ?? Environment.GetEnvironmentVariable("JWT_KEY");
}
if (string.IsNullOrWhiteSpace(jwtIssuer))
{
    jwtIssuer = Environment.GetEnvironmentVariable("Jwt__Issuer") ?? Environment.GetEnvironmentVariable("JWT_ISSUER");
}
if (string.IsNullOrWhiteSpace(jwtAudience))
{
    jwtAudience = Environment.GetEnvironmentVariable("Jwt__Audience") ?? Environment.GetEnvironmentVariable("JWT_AUDIENCE");
}
if (string.IsNullOrWhiteSpace(jwtKey) || string.IsNullOrWhiteSpace(jwtIssuer) || string.IsNullOrWhiteSpace(jwtAudience))
{
    throw new InvalidOperationException("JWT configuration missing. Please set 'Jwt:Key', 'Jwt:Issuer' and 'Jwt:Audience' via appsettings or environment variables (Jwt__Key/JWT_KEY etc.).");
}

builder.Services.AddControllers();

// Memory cache for tenant caching
builder.Services.AddMemoryCache();

// Tenant accessor
builder.Services.AddScoped<ITenantAccessor, TenantAccessor>();

// DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    var conn = configuration.GetConnectionString("DefaultConnection") ?? "Server=.;Database=UabIndia_HRMS;Trusted_Connection=True;";
    options.UseSqlServer(conn);
});

// Auth - JWT
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(jwtKey))
    };
});

// DI for identity services
builder.Services.AddSingleton<UabIndia.Identity.Services.JwtService>();
builder.Services.AddSingleton<UabIndia.Identity.Services.RefreshTokenService>();
// Refresh token repository
builder.Services.AddScoped<UabIndia.Application.Interfaces.IRefreshTokenRepository, UabIndia.Infrastructure.Data.RefreshTokenRepository>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseMiddleware<ExceptionMiddleware>();
app.UseMiddleware<TenantResolverMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Health endpoint for readiness checks (simple DB connectivity)
app.MapGet("/health", async (ApplicationDbContext db) =>
{
    try
    {
        var canConnect = await db.Database.CanConnectAsync();
        return Results.Json(new { status = canConnect ? "Healthy" : "Unhealthy" }, statusCode: canConnect ? 200 : 503);
    }
    catch (Exception ex)
    {
        return Results.Json(new { status = "Unhealthy", error = ex.Message }, statusCode: 503);
    }
});

app.MapControllers();

app.Run();
