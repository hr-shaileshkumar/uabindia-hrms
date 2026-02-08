// CRITICAL SECURITY FIXES TO IMPLEMENT
// File: Backend/src/UabIndia.Api/Security/SecurityHeadersMiddleware.cs

using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace UabIndia.Api.Middleware
{
    public class SecurityHeadersMiddleware
    {
        private readonly RequestDelegate _next;

        public SecurityHeadersMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task Invoke(HttpContext context)
        {
            // HSTS (HTTP Strict Transport Security) - Force HTTPS for 1 year
            context.Response.Headers.Append("Strict-Transport-Security", 
                "max-age=31536000; includeSubDomains; preload");

            // Permissions Policy (formerly Feature Policy)
            context.Response.Headers.Append("Permissions-Policy", 
                "geolocation=(), microphone=(), camera=(), usb=(), payment=()");

            // Prevent MIME sniffing
            context.Response.Headers.Append("X-Content-Type-Options", "nosniff");

            // Clickjacking protection
            context.Response.Headers.Append("X-Frame-Options", "DENY");

            // XSS Protection
            context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");

            // Referrer Policy
            context.Response.Headers.Append("Referrer-Policy", 
                "strict-origin-when-cross-origin");

            await _next(context);
        }
    }
}

// =============================================================================
// FIX 1: Add to Program.cs - Register SecurityHeadersMiddleware AFTER UseHttpsRedirection
// =============================================================================
/*
app.UseHttpsRedirection();
app.UseMiddleware<SecurityHeadersMiddleware>();  // ADD THIS LINE
app.UseCors("default");
*/

// =============================================================================
// FIX 2: Strengthen CSRF Protection - Add SameSite to Cookies
// File: Backend/src/UabIndia.Api/Controllers/AuthController.cs
// =============================================================================
/*
CURRENT:
    private void SetAuthCookies(string accessToken, string refreshToken, DateTime expires)
    {
        var httpOnlyOption = new CookieOptions
        {
            HttpOnly = true,
            Expires = expires,
            IsEssential = true,
            Secure = true, // HTTPS only
        };

        Response.Cookies.Append("access_token", accessToken, httpOnlyOption);
        Response.Cookies.Append("refresh_token", refreshToken, httpOnlyOption);
    }

FIX: Add SameSite
    private void SetAuthCookies(string accessToken, string refreshToken, DateTime expires)
    {
        var httpOnlyOption = new CookieOptions
        {
            HttpOnly = true,
            Expires = expires,
            IsEssential = true,
            Secure = true, // HTTPS only
            SameSite = SameSiteMode.Strict, // CSRF protection
            Path = "/",
            Domain = null // Let browser determine domain
        };

        Response.Cookies.Append("access_token", accessToken, httpOnlyOption);
        Response.Cookies.Append("refresh_token", refreshToken, httpOnlyOption);
    }
*/

// =============================================================================
// FIX 3: Implement Token Revocation
// File: Backend/src/UabIndia.Core/Entities/RevokedToken.cs (NEW FILE)
// =============================================================================
/*
using System;

namespace UabIndia.Core.Entities
{
    public class RevokedToken
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TenantId { get; set; }
        public Guid UserId { get; set; }
        public string TokenHash { get; set; } // SHA256 hash of token
        public DateTime RevokedAt { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresAt { get; set; }
        public string Reason { get; set; } // "manual_revocation", "logout", "security_alert"
    }
}
*/

// =============================================================================
// FIX 4: Input Validation with FluentValidation
// File: Backend/src/UabIndia.Api/Validators/LoginRequestValidator.cs (NEW FILE)
// =============================================================================
/*
using FluentValidation;
using UabIndia.Api.Models;

namespace UabIndia.Api.Validators
{
    public class LoginRequestValidator : AbstractValidator<LoginRequest>
    {
        public LoginRequestValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required")
                .EmailAddress().WithMessage("Email format is invalid")
                .MaximumLength(256).WithMessage("Email too long");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Password is required")
                .MinimumLength(8).WithMessage("Password must be at least 8 characters")
                .MaximumLength(128).WithMessage("Password too long");

            RuleFor(x => x.DeviceId)
                .NotEmpty().WithMessage("DeviceId is required")
                .MaximumLength(256).WithMessage("DeviceId too long");
        }
    }
}
*/

// =============================================================================
// FIX 5: Rate Limiting Configuration - Strengthen Auth Endpoints
// File: Backend/src/UabIndia.Api/Program.cs
// =============================================================================
/*
CURRENT (around line 243):
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: "login",
            factory: _ =>
                new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 5,
                    Window = TimeSpan.FromMinutes(15)
                }
        ),

SHOULD BE:
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: "login",
            factory: _ =>
                new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 5,    // 5 attempts
                    Window = TimeSpan.FromMinutes(15), // Per 15 minutes
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 2 // Reject after 2 queued
                }
        ),

// Add stricter policy for failed logins:
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: "login-failed",
            factory: _ =>
                new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 3,    // 3 failed attempts
                    Window = TimeSpan.FromMinutes(5) // Lock for 5 minutes
                }
        ),
*/

// =============================================================================
// FIX 6: Encrypt Sensitive PII Fields
// File: Backend/src/UabIndia.Infrastructure/Data/ApplicationDbContext.cs
// =============================================================================
/*
Add encryption configuration for Entity properties:

modelBuilder.Entity<Employee>(entity =>
{
    entity.Property(e => e.Email)
        .HasConversion(
            v => EncryptionService.Encrypt(v),
            v => EncryptionService.Decrypt(v))
        .HasMaxLength(256);

    entity.Property(e => e.PhoneNumber)
        .HasConversion(
            v => EncryptionService.Encrypt(v),
            v => EncryptionService.Decrypt(v))
        .HasMaxLength(20);

    entity.Property(e => e.PermanentAddress)
        .HasConversion(
            v => EncryptionService.Encrypt(v),
            v => EncryptionService.Decrypt(v))
        .HasMaxLength(1000);
});
*/

// =============================================================================
// FIX 7: Implement Structured Error Responses
// File: Backend/src/UabIndia.Api/Models/ErrorResponse.cs (NEW FILE)
// =============================================================================
/*
namespace UabIndia.Api.Models
{
    public class ErrorResponse
    {
        public string Code { get; set; } // ERR_INVALID_CREDENTIALS, ERR_UNAUTHORIZED, etc.
        public string Message { get; set; }
        public Dictionary<string, string[]> Errors { get; set; } // Field validation errors
        public string TraceId { get; set; } // For logging
        public int StatusCode { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    // Enum for error codes
    public enum ErrorCode
    {
        INVALID_CREDENTIALS = 1001,
        INVALID_TOKEN = 1002,
        TOKEN_EXPIRED = 1003,
        UNAUTHORIZED = 1004,
        FORBIDDEN = 1005,
        INVALID_INPUT = 2001,
        VALIDATION_FAILED = 2002,
        NOT_FOUND = 3001,
        CONFLICT = 3002,
        INTERNAL_SERVER_ERROR = 5000,
    }
}
*/

// =============================================================================
// FIX 8: Structured Logging with Serilog
// File: Backend/src/UabIndia.Api/Program.cs
// =============================================================================
/*
ADD NUGET: Serilog, Serilog.Sinks.Console, Serilog.Sinks.File, Serilog.Enrichers.Environment

In Program.cs startup:

// Structured logging
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .Enrich.FromLogContext()
    .Enrich.WithEnvironmentUserName()
    .Enrich.WithMachineName()
    .Enrich.WithThreadId()
    .WriteTo.Console()
    .WriteTo.File(
        "logs/hrms-.txt",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 30,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

builder.Host.UseSerilog();
*/

// =============================================================================
// FIX 9: API Response Pagination Defaults
// File: Backend/src/UabIndia.Api/Controllers/BaseController.cs (NEW FILE)
// =============================================================================
/*
using Microsoft.AspNetCore.Mvc;

namespace UabIndia.Api.Controllers
{
    public abstract class BaseController : ControllerBase
    {
        protected const int DEFAULT_PAGE_SIZE = 10;
        protected const int MAX_PAGE_SIZE = 100;
        protected const int MIN_PAGE_SIZE = 1;

        protected int GetPageSize(int? requestedSize)
        {
            if (requestedSize == null) return DEFAULT_PAGE_SIZE;
            if (requestedSize < MIN_PAGE_SIZE) return MIN_PAGE_SIZE;
            if (requestedSize > MAX_PAGE_SIZE) return MAX_PAGE_SIZE;
            return requestedSize.Value;
        }

        protected int GetPage(int? requestedPage)
        {
            return requestedPage == null || requestedPage < 1 ? 1 : requestedPage.Value;
        }
    }
}
*/

// =============================================================================
// FIX 10: File Upload Security Handler
// File: Backend/src/UabIndia.Api/Services/FileUploadService.cs (NEW FILE)
// =============================================================================
/*
using System;
using System.IO;
using System.Threading.Tasks;

namespace UabIndia.Api.Services
{
    public interface IFileUploadService
    {
        Task<string> UploadAsync(Stream fileStream, string fileName, string contentType, long maxSizeBytes = 5242880); // 5MB default
    }

    public class FileUploadService : IFileUploadService
    {
        private readonly string _uploadPath;
        private readonly HashSet<string> _allowedExtensions;
        private readonly HashSet<string> _allowedMimeTypes;

        public FileUploadService(string uploadPath)
        {
            _uploadPath = uploadPath;
            _allowedExtensions = new HashSet<string> { ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".png", ".gif" };
            _allowedMimeTypes = new HashSet<string> 
            { 
                "application/pdf", 
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "image/jpeg",
                "image/png",
                "image/gif"
            };
        }

        public async Task<string> UploadAsync(Stream fileStream, string fileName, string contentType, long maxSizeBytes = 5242880)
        {
            // Validate file extension
            var ext = Path.GetExtension(fileName).ToLower();
            if (!_allowedExtensions.Contains(ext))
                throw new ArgumentException("File type not allowed");

            // Validate MIME type
            if (!_allowedMimeTypes.Contains(contentType))
                throw new ArgumentException("Invalid content type");

            // Validate file size
            if (fileStream.Length > maxSizeBytes)
                throw new ArgumentException($"File size exceeds {maxSizeBytes / 1024 / 1024}MB limit");

            // Generate safe filename
            var safeFileName = Guid.NewGuid().ToString() + ext;
            var filePath = Path.Combine(_uploadPath, safeFileName);

            // Create directory if not exists
            Directory.CreateDirectory(_uploadPath);

            // Save file
            await using (var fileOutput = File.Create(filePath))
            {
                await fileStream.CopyToAsync(fileOutput);
            }

            return safeFileName;
        }
    }
}
*/

// =============================================================================
// FIX 11: Frontend - Add CSRF Token Handling
// File: frontend-next/src/lib/apiClient.ts
// =============================================================================
/*
ADD CSRF token to every POST/PUT/DELETE request:

// Request interceptor: Add CSRF token for state-changing requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add CSRF token for state-changing requests
    if (["POST", "PUT", "DELETE", "PATCH"].includes(config.method?.toUpperCase() || "")) {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      if (csrfToken) {
        config.headers["X-CSRF-Token"] = csrfToken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);
*/

// =============================================================================
// FIX 12: API Endpoint Permission Validation
// File: Backend/src/UabIndia.Api/Controllers/SettingsController.cs
// =============================================================================
/*
CURRENT:
    [HttpGet("feature-flags")]
    public async Task<IActionResult> GetFeatureFlags()
    {
        var tenantId = _tenantAccessor.GetTenantId();
        // ...
    }

FIX: Add permission check
    [HttpGet("feature-flags")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> GetFeatureFlags()
    {
        var tenantId = _tenantAccessor.GetTenantId();
        var userId = User?.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        
        // Verify user is still active and has permission
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == Guid.Parse(userId));
        if (user == null || !user.IsActive)
            return Unauthorized("User no longer exists or is inactive");

        // ...
    }
*/

// =============================================================================
// SUMMARY OF CRITICAL FIXES
// =============================================================================
/*
1. ✅ SecurityHeadersMiddleware - Add HSTS, Permissions-Policy
2. ✅ SameSite Cookies - Add SameSite=Strict
3. ✅ Token Revocation - Create RevokedToken entity
4. ✅ Input Validation - Implement FluentValidation
5. ✅ Rate Limiting - Strengthen auth endpoints
6. ✅ PII Encryption - Add EF Core value converters
7. ✅ Structured Errors - ErrorResponse & ErrorCode
8. ✅ Structured Logging - Implement Serilog
9. ✅ Pagination Defaults - Prevent data dumps
10. ✅ File Upload Security - Validate MIME types
11. ✅ CSRF Token - Frontend header injection
12. ✅ Permission Validation - API-level enforcement

Estimated Implementation Time: 2-3 days
Priority: CRITICAL - Deploy before production
*/
