# 🔐 SPRINT 1: CRITICAL SECURITY HARDENING IMPLEMENTATION

**Duration:** Week 1-2  
**Priority:** 🔴 CRITICAL  
**Owner:** Backend Lead + Security Officer  
**Estimated Hours:** 40 hours

---

## 📋 TASK BREAKDOWN

### Task 1: SecurityHeadersMiddleware ✅

**Files to Create/Modify:**
- Create: `Backend/src/UabIndia.Api/Middleware/SecurityHeadersMiddleware.cs`
- Modify: `Backend/src/UabIndia.Api/Program.cs`

#### Step 1: Create SecurityHeadersMiddleware

```csharp
// Backend/src/UabIndia.Api/Middleware/SecurityHeadersMiddleware.cs
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace UabIndia.Api.Middleware
{
    public class SecurityHeadersMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<SecurityHeadersMiddleware> _logger;

        public SecurityHeadersMiddleware(RequestDelegate next, ILogger<SecurityHeadersMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // HSTS (HTTP Strict Transport Security)
            // Forces HTTPS for 1 year + includes subdomains + allows preload
            context.Response.Headers.Add("Strict-Transport-Security", 
                "max-age=31536000; includeSubDomains; preload");

            // Content Security Policy - Prevents XSS attacks
            context.Response.Headers.Add("Content-Security-Policy", 
                "default-src 'self'; " +
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' cdn.vercel-insights.com; " +
                "style-src 'self' 'unsafe-inline'; " +
                "img-src 'self' data: https:; " +
                "font-src 'self'; " +
                "connect-src 'self' https:; " +
                "frame-ancestors 'none'; " +
                "base-uri 'self'; " +
                "form-action 'self'");

            // X-Content-Type-Options - Prevents MIME sniffing
            context.Response.Headers.Add("X-Content-Type-Options", "nosniff");

            // X-Frame-Options - Prevents clickjacking
            context.Response.Headers.Add("X-Frame-Options", "DENY");

            // X-XSS-Protection - Legacy XSS protection (for older browsers)
            context.Response.Headers.Add("X-XSS-Protection", "1; mode=block");

            // Referrer-Policy - Controls referrer info
            context.Response.Headers.Add("Referrer-Policy", "strict-origin-when-cross-origin");

            // Permissions-Policy - Controls browser features
            context.Response.Headers.Add("Permissions-Policy", 
                "geolocation=(), " +
                "microphone=(), " +
                "camera=(), " +
                "payment=(), " +
                "usb=(), " +
                "magnetometer=(), " +
                "gyroscope=(), " +
                "accelerometer=()");

            // Remove server header (don't advertise ASP.NET)
            context.Response.Headers.Remove("Server");
            context.Response.Headers.Remove("X-Powered-By");

            _logger.LogInformation("Security headers applied to response");
            
            await _next(context);
        }
    }
}
```

#### Step 2: Register in Program.cs

```csharp
// Add to Program.cs, after app.UseRouting() and before app.MapControllers()

// Add security headers middleware
app.UseMiddleware<SecurityHeadersMiddleware>();

// Add security headers options
app.UseCors(builder =>
{
    builder
        .WithOrigins(
            "http://localhost:3000",
            "http://localhost:3001",
            Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "https://hrms.example.com"
        )
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials()
        .WithExposedHeaders("X-Total-Count", "X-Page-Number", "X-Page-Size");
});
```

---

### Task 2: Token Revocation System ✅

**Files to Create/Modify:**
- Create: `Backend/src/UabIndia.Core/Entities/RevokedToken.cs`
- Create: `Backend/src/UabIndia.Infrastructure/Repositories/RevokedTokenRepository.cs`
- Modify: `Backend/db/schema.sql` - Add RevokedTokens table
- Modify: `Backend/src/UabIndia.Api/Controllers/AuthController.cs` - Add logout token revocation

#### Step 1: Create RevokedToken Entity

```csharp
// Backend/src/UabIndia.Core/Entities/RevokedToken.cs
using UabIndia.SharedKernel;
using System;

namespace UabIndia.Core.Entities
{
    public class RevokedToken : Entity
    {
        public Guid TokenId { get; set; }
        public Guid UserId { get; set; }
        public string TokenHash { get; set; } // SHA256 hash of token
        public DateTime RevokedAt { get; set; }
        public DateTime ExpiresAt { get; set; } // Token expiration time
        public string Reason { get; set; } // "Logout", "PasswordChange", "AdminRevoke", etc.
        
        public User User { get; set; }

        public static RevokedToken Create(string tokenHash, Guid userId, DateTime expiresAt, string reason)
        {
            return new RevokedToken
            {
                Id = Guid.NewGuid(),
                TokenId = Guid.NewGuid(),
                TokenHash = tokenHash,
                UserId = userId,
                RevokedAt = DateTime.UtcNow,
                ExpiresAt = expiresAt,
                Reason = reason,
                CreatedAt = DateTime.UtcNow
            };
        }

        public bool IsExpired() => DateTime.UtcNow > ExpiresAt;
    }
}
```

#### Step 2: Add Database Table

```sql
-- Backend/db/schema.sql - Add to relevant section
CREATE TABLE [RevokedTokens] (
    [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    [TenantId] UNIQUEIDENTIFIER NOT NULL,
    [TokenId] UNIQUEIDENTIFIER NOT NULL UNIQUE,
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [TokenHash] NVARCHAR(MAX) NOT NULL,
    [RevokedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [ExpiresAt] DATETIME2 NOT NULL,
    [Reason] NVARCHAR(50) NOT NULL DEFAULT 'Logout',
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [CreatedBy] NVARCHAR(255),
    [IsDeleted] BIT NOT NULL DEFAULT 0,
    
    CONSTRAINT FK_RevokedTokens_Users FOREIGN KEY ([UserId]) REFERENCES [Users]([Id]),
    CONSTRAINT FK_RevokedTokens_Tenants FOREIGN KEY ([TenantId]) REFERENCES [Tenants]([Id]),
    INDEX IX_RevokedTokens_UserId ([UserId]),
    INDEX IX_RevokedTokens_ExpiresAt ([ExpiresAt]),
    INDEX IX_RevokedTokens_TokenHash ([TokenHash](100))
);
```

#### Step 3: Create Repository

```csharp
// Backend/src/UabIndia.Infrastructure/Repositories/RevokedTokenRepository.cs
using UabIndia.Core.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;

namespace UabIndia.Infrastructure.Repositories
{
    public interface IRevokedTokenRepository
    {
        Task AddAsync(RevokedToken revokedToken);
        Task<bool> IsTokenRevokedAsync(string tokenHash);
        Task CleanupExpiredTokensAsync();
    }

    public class RevokedTokenRepository : IRevokedTokenRepository
    {
        private readonly ApplicationDbContext _context;

        public RevokedTokenRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(RevokedToken revokedToken)
        {
            await _context.RevokedTokens.AddAsync(revokedToken);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> IsTokenRevokedAsync(string tokenHash)
        {
            var exists = await _context.RevokedTokens
                .AnyAsync(rt => rt.TokenHash == tokenHash && !rt.IsDeleted);
            
            return exists;
        }

        public async Task CleanupExpiredTokensAsync()
        {
            // Soft-delete expired tokens (older than 30 days)
            var expiredTokens = await _context.RevokedTokens
                .Where(rt => rt.ExpiresAt < DateTime.UtcNow.AddDays(-30) && !rt.IsDeleted)
                .ToListAsync();

            foreach (var token in expiredTokens)
            {
                token.IsDeleted = true;
                token.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
        }
    }
}
```

#### Step 4: Update AuthController Logout

```csharp
// Backend/src/UabIndia.Api/Controllers/AuthController.cs - Update Logout method

[HttpPost("logout")]
[Authorize]
public async Task<IActionResult> Logout()
{
    try
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userId, out var userGuid))
        {
            return Unauthorized("Invalid user");
        }

        // Get token from request
        var token = Request.Headers["Authorization"]
            .ToString()
            .Replace("Bearer ", "");

        // Hash the token
        var tokenHash = HashToken(token);

        // Extract expiration from JWT claims
        var expClaim = User.FindFirst("exp")?.Value;
        var expiresAt = DateTime.UnixEpoch.AddSeconds(long.Parse(expClaim ?? "0"));

        // Add to revoked tokens
        var revokedToken = RevokedToken.Create(tokenHash, userGuid, expiresAt, "Logout");
        await _revokedTokenRepository.AddAsync(revokedToken);

        // Clear cookies
        Response.Cookies.Delete("accessToken");
        Response.Cookies.Delete("refreshToken");

        _logger.LogInformation($"User {userGuid} logged out successfully");
        return Ok(new { message = "Logged out successfully" });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Logout error");
        return StatusCode(500, new ErrorResponse 
        { 
            ErrorCode = "LOGOUT_ERROR",
            Message = "An error occurred during logout" 
        });
    }
}

private string HashToken(string token)
{
    using (var sha256 = System.Security.Cryptography.SHA256.Create())
    {
        var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(hash);
    }
}
```

#### Step 5: Update JWT Validation Middleware

```csharp
// Add to JWT validation in Program.cs or custom middleware
services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // ... existing options ...
        
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var revokedTokenRepo = context.HttpContext.RequestServices
                    .GetRequiredService<IRevokedTokenRepository>();

                var token = context.Request.Headers["Authorization"]
                    .ToString()
                    .Replace("Bearer ", "");

                var tokenHash = HashToken(token);
                
                if (await revokedTokenRepo.IsTokenRevokedAsync(tokenHash))
                {
                    context.Fail("Token has been revoked");
                }
            }
        };
    });
```

---

### Task 3: FluentValidation for DTOs ✅

**Files to Create/Modify:**
- Create: `Backend/src/UabIndia.Application/Validators/LoginRequestValidator.cs`
- Create: `Backend/src/UabIndia.Application/Validators/CreateUserValidator.cs`
- Modify: `Backend/src/UabIndia.Api/Program.cs` - Register validators

#### Step 1: Create LoginRequestValidator

```csharp
// Backend/src/UabIndia.Application/Validators/LoginRequestValidator.cs
using FluentValidation;
using UabIndia.Application.Dtos;

namespace UabIndia.Application.Validators
{
    public class LoginRequestValidator : AbstractValidator<LoginRequestDto>
    {
        public LoginRequestValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required")
                .EmailAddress().WithMessage("Invalid email format")
                .MaximumLength(255).WithMessage("Email must not exceed 255 characters");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Password is required")
                .MinimumLength(6).WithMessage("Password must be at least 6 characters")
                .MaximumLength(100).WithMessage("Password must not exceed 100 characters")
                .Matches(@"[A-Z]").WithMessage("Password must contain at least one uppercase letter")
                .Matches(@"[a-z]").WithMessage("Password must contain at least one lowercase letter")
                .Matches(@"[0-9]").WithMessage("Password must contain at least one digit")
                .Matches(@"[!@#$%^&*(),.?\"":{}|<>]").WithMessage("Password must contain at least one special character");

            RuleFor(x => x.RememberMe)
                .NotNull().WithMessage("Remember me flag is required");
        }
    }
}
```

#### Step 2: Create CreateUserValidator

```csharp
// Backend/src/UabIndia.Application/Validators/CreateUserValidator.cs
using FluentValidation;
using UabIndia.Application.Dtos;

namespace UabIndia.Application.Validators
{
    public class CreateUserValidator : AbstractValidator<CreateUserDto>
    {
        public CreateUserValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required")
                .EmailAddress().WithMessage("Invalid email format")
                .MaximumLength(255).WithMessage("Email must not exceed 255 characters");

            RuleFor(x => x.FirstName)
                .NotEmpty().WithMessage("First name is required")
                .MaximumLength(100).WithMessage("First name must not exceed 100 characters")
                .Matches(@"^[a-zA-Z\s'-]*$").WithMessage("First name can only contain letters, spaces, hyphens, and apostrophes");

            RuleFor(x => x.LastName)
                .NotEmpty().WithMessage("Last name is required")
                .MaximumLength(100).WithMessage("Last name must not exceed 100 characters")
                .Matches(@"^[a-zA-Z\s'-]*$").WithMessage("Last name can only contain letters, spaces, hyphens, and apostrophes");

            RuleFor(x => x.PhoneNumber)
                .NotEmpty().WithMessage("Phone number is required")
                .Matches(@"^\d{10}$").WithMessage("Phone number must be exactly 10 digits")
                .When(x => !string.IsNullOrEmpty(x.PhoneNumber));

            RuleFor(x => x.RoleId)
                .NotEmpty().WithMessage("Role is required")
                .NotEqual(Guid.Empty).WithMessage("Invalid role");

            RuleFor(x => x.CompanyId)
                .NotEmpty().WithMessage("Company is required")
                .NotEqual(Guid.Empty).WithMessage("Invalid company");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Password is required")
                .MinimumLength(8).WithMessage("Password must be at least 8 characters")
                .Matches(@"[A-Z]").WithMessage("Password must contain at least one uppercase letter")
                .Matches(@"[a-z]").WithMessage("Password must contain at least one lowercase letter")
                .Matches(@"[0-9]").WithMessage("Password must contain at least one digit")
                .Matches(@"[!@#$%^&*(),.?\"":{}|<>]").WithMessage("Password must contain at least one special character");
        }
    }
}
```

#### Step 3: Register in Program.cs

```csharp
// Add to Program.cs
builder.Services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>();

// Add FluentValidation middleware
services.AddFluentValidationAutoValidation()
    .AddFluentValidationClientsideAdapters();

// Add a global validation error response middleware
services.AddScoped<ValidationExceptionHandler>();
```

---

### Task 4: Structured Error Responses ✅

**Files to Create/Modify:**
- Create: `Backend/src/UabIndia.Core/Exceptions/ErrorCode.cs`
- Create: `Backend/src/UabIndia.Api/Middleware/ExceptionHandlingMiddleware.cs`
- Create: `Backend/src/UabIndia.Api/Dtos/ErrorResponse.cs`

#### Step 1: Create ErrorCode Enum

```csharp
// Backend/src/UabIndia.Core/Exceptions/ErrorCode.cs
namespace UabIndia.Core.Exceptions
{
    public enum ErrorCode
    {
        // Auth Errors (1000-1999)
        INVALID_CREDENTIALS = 1001,
        USER_NOT_FOUND = 1002,
        USER_LOCKED = 1003,
        TOKEN_EXPIRED = 1004,
        TOKEN_INVALID = 1005,
        TOKEN_REVOKED = 1006,
        UNAUTHORIZED = 1007,

        // Validation Errors (2000-2999)
        VALIDATION_ERROR = 2001,
        INVALID_EMAIL = 2002,
        INVALID_PASSWORD = 2003,
        DUPLICATE_EMAIL = 2004,
        WEAK_PASSWORD = 2005,

        // Not Found Errors (3000-3999)
        USER_NOT_FOUND_404 = 3001,
        COMPANY_NOT_FOUND = 3002,
        EMPLOYEE_NOT_FOUND = 3003,
        RESOURCE_NOT_FOUND = 3004,

        // Permission Errors (4000-4999)
        FORBIDDEN = 4001,
        INSUFFICIENT_PERMISSIONS = 4002,
        TENANT_MISMATCH = 4003,

        // Business Logic Errors (5000-5999)
        INVALID_STATE = 5001,
        DUPLICATE_RECORD = 5002,
        OPERATION_NOT_ALLOWED = 5003,
        INVALID_OPERATION = 5004,

        // External Service Errors (6000-6999)
        EXTERNAL_SERVICE_ERROR = 6001,
        EMAIL_SEND_FAILED = 6002,
        PAYMENT_FAILED = 6003,

        // Server Errors (7000-7999)
        INTERNAL_SERVER_ERROR = 7001,
        DATABASE_ERROR = 7002,
        FILE_OPERATION_ERROR = 7003,
        RATE_LIMIT_EXCEEDED = 7004
    }
}
```

#### Step 2: Create ErrorResponse DTO

```csharp
// Backend/src/UabIndia.Api/Dtos/ErrorResponse.cs
using UabIndia.Core.Exceptions;
using System.Collections.Generic;

namespace UabIndia.Api.Dtos
{
    public class ErrorResponse
    {
        public int ErrorCode { get; set; }
        public string Message { get; set; }
        public string Details { get; set; }
        public Dictionary<string, string[]> ValidationErrors { get; set; }
        public string RequestId { get; set; }
        public string Timestamp { get; set; }

        public ErrorResponse(ErrorCode errorCode, string message, string details = null)
        {
            ErrorCode = (int)errorCode;
            Message = message;
            Details = details;
            Timestamp = DateTime.UtcNow.ToString("O");
        }

        public ErrorResponse(ErrorCode errorCode, string message, Dictionary<string, string[]> validationErrors)
        {
            ErrorCode = (int)errorCode;
            Message = message;
            ValidationErrors = validationErrors;
            Timestamp = DateTime.UtcNow.ToString("O");
        }
    }
}
```

#### Step 3: Create Exception Handling Middleware

```csharp
// Backend/src/UabIndia.Api/Middleware/ExceptionHandlingMiddleware.cs
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using UabIndia.Api.Dtos;
using UabIndia.Core.Exceptions;
using FluentValidation;

namespace UabIndia.Api.Middleware
{
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;

        public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unhandled exception has occurred.");
                await HandleExceptionAsync(context, ex);
            }
        }

        private static Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";
            var response = new ErrorResponse(
                ErrorCode.INTERNAL_SERVER_ERROR,
                "An error occurred while processing your request",
                exception.Message
            )
            {
                RequestId = context.TraceIdentifier
            };

            switch (exception)
            {
                case ValidationException validationEx:
                    context.Response.StatusCode = StatusCodes.Status400BadRequest;
                    var errors = new Dictionary<string, string[]>();
                    foreach (var error in validationEx.Errors)
                    {
                        if (!errors.ContainsKey(error.PropertyName))
                            errors[error.PropertyName] = new[] { error.ErrorMessage };
                        else
                            errors[error.PropertyName] = errors[error.PropertyName]
                                .Append(error.ErrorMessage).ToArray();
                    }
                    response = new ErrorResponse(ErrorCode.VALIDATION_ERROR, "Validation failed", errors);
                    break;

                case UnauthorizedAccessException:
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    response = new ErrorResponse(ErrorCode.UNAUTHORIZED, "Unauthorized");
                    break;

                case KeyNotFoundException:
                    context.Response.StatusCode = StatusCodes.Status404NotFound;
                    response = new ErrorResponse(ErrorCode.RESOURCE_NOT_FOUND, "Resource not found");
                    break;

                default:
                    context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                    response = new ErrorResponse(
                        ErrorCode.INTERNAL_SERVER_ERROR,
                        "An internal server error occurred"
                    );
                    break;
            }

            return context.Response.WriteAsJsonAsync(response);
        }
    }
}
```

#### Step 4: Register in Program.cs

```csharp
// Add to Program.cs
app.UseMiddleware<ExceptionHandlingMiddleware>();
```

---

### Task 5: Strengthen Rate Limiting ✅

**Files to Modify:**
- `Backend/src/UabIndia.Api/Program.cs`

#### Implementation:

```csharp
// Add to Program.cs - before app.Build()
var rateLimiterPolicy = """
    fixed window
    window 15m
    permit limit 5
    """;

builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter(policyName: "login", options =>
    {
        options.PermitLimit = 5;
        options.Window = TimeSpan.FromMinutes(15);
        options.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        options.QueueLimit = 2;
    });

    options.AddFixedWindowLimiter(policyName: "api", options =>
    {
        options.PermitLimit = 100;
        options.Window = TimeSpan.FromMinutes(1);
        options.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        options.QueueLimit = 10;
    });

    options.AddFixedWindowLimiter(policyName: "payment", options =>
    {
        options.PermitLimit = 10;
        options.Window = TimeSpan.FromMinutes(5);
        options.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        options.QueueLimit = 5;
    });

    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = 429;
        context.HttpContext.Response.ContentType = "application/json";
        
        var response = new { error = "Too many requests. Please try again later." };
        await context.HttpContext.Response.WriteAsJsonAsync(response, token);
    };
});

// In Configure section
app.UseRateLimiter();

// On Login endpoint
[HttpPost("login")]
[EnableRateLimiting("login")]
public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
{
    // ... implementation
}

// On Payment endpoints
[HttpPost("payment")]
[EnableRateLimiting("payment")]
[Authorize]
public async Task<IActionResult> ProcessPayment([FromBody] PaymentRequestDto request)
{
    // ... implementation
}
```

---

### Task 6: Add CSRF Token Validation ✅

**Frontend Implementation:**

```typescript
// frontend-next/src/lib/csrfToken.ts
import { apiClient } from "./apiClient";

export async function getCsrfToken(): Promise<string> {
  try {
    const response = await apiClient.get("/api/v1/auth/csrf-token");
    return response.data.token;
  } catch (error) {
    console.error("Failed to fetch CSRF token", error);
    throw error;
  }
}

export async function getCsrfTokenAndSetHeader(): Promise<void> {
  const token = await getCsrfToken();
  // Store in sessionStorage or state
  sessionStorage.setItem("csrfToken", token);
  // Add to default headers
  apiClient.defaults.headers.common["X-CSRF-Token"] = token;
}

// Initialize on app load
export function initializeCsrfToken(): void {
  if (typeof window !== "undefined") {
    getCsrfTokenAndSetHeader().catch(console.error);
  }
}
```

```typescript
// frontend-next/src/app/(protected)/layout.tsx
"use client";

import { useEffect } from "react";
import { initializeCsrfToken } from "@/lib/csrfToken";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    initializeCsrfToken();
  }, []);

  return <>{children}</>;
}
```

**Backend Implementation:**

```csharp
// Backend/src/UabIndia.Api/Controllers/AuthController.cs
[HttpGet("csrf-token")]
[AllowAnonymous]
public IActionResult GetCsrfToken()
{
    var token = Guid.NewGuid().ToString();
    HttpContext.Session.SetString("CsrfToken", token);
    return Ok(new { token });
}

// Add CSRF validation to POST endpoints
[HttpPost("login")]
[ValidateCsrfToken]
[EnableRateLimiting("login")]
public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
{
    // ... implementation
}
```

```csharp
// Backend/src/UabIndia.Api/Middleware/ValidateCsrfTokenAttribute.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace UabIndia.Api.Middleware
{
    public class ValidateCsrfTokenAttribute : Attribute, IAsyncAuthorizationFilter
    {
        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            if (!IsHttpMethodNeedsValidation(context.HttpContext.Request.Method))
            {
                return;
            }

            var token = context.HttpContext.Request.Headers["X-CSRF-Token"].FirstOrDefault();
            var sessionToken = context.HttpContext.Session.GetString("CsrfToken");

            if (string.IsNullOrEmpty(token) || token != sessionToken)
            {
                context.Result = new UnauthorizedResult();
            }

            await Task.CompletedTask;
        }

        private bool IsHttpMethodNeedsValidation(string method)
        {
            return method.Equals("POST", StringComparison.OrdinalIgnoreCase) ||
                   method.Equals("PUT", StringComparison.OrdinalIgnoreCase) ||
                   method.Equals("DELETE", StringComparison.OrdinalIgnoreCase) ||
                   method.Equals("PATCH", StringComparison.OrdinalIgnoreCase);
        }
    }
}
```

---

### Task 7: Encrypt PII Fields ✅

**Implementation:**

```csharp
// Backend/src/UabIndia.Core/Services/EncryptionService.cs
using System;
using System.Security.Cryptography;
using System.Text;

namespace UabIndia.Core.Services
{
    public interface IEncryptionService
    {
        string Encrypt(string plainText);
        string Decrypt(string cipherText);
    }

    public class EncryptionService : IEncryptionService
    {
        private readonly string _encryptionKey;

        public EncryptionService(IConfiguration configuration)
        {
            _encryptionKey = configuration["Encryption:Key"] 
                ?? throw new InvalidOperationException("Encryption key not configured");
        }

        public string Encrypt(string plainText)
        {
            if (string.IsNullOrEmpty(plainText))
                return plainText;

            using (var aes = Aes.Create())
            {
                aes.Key = Encoding.UTF8.GetBytes(_encryptionKey.PadRight(32).Substring(0, 32));
                aes.GenerateIV();

                using (var encryptor = aes.CreateEncryptor(aes.Key, aes.IV))
                using (var ms = new MemoryStream())
                {
                    ms.Write(aes.IV, 0, aes.IV.Length);
                    using (var cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
                    using (var sw = new StreamWriter(cs))
                    {
                        sw.Write(plainText);
                    }
                    return Convert.ToBase64String(ms.ToArray());
                }
            }
        }

        public string Decrypt(string cipherText)
        {
            if (string.IsNullOrEmpty(cipherText))
                return cipherText;

            using (var aes = Aes.Create())
            {
                aes.Key = Encoding.UTF8.GetBytes(_encryptionKey.PadRight(32).Substring(0, 32));

                var buffer = Convert.FromBase64String(cipherText);
                aes.IV = buffer.Take(aes.IV.Length).ToArray();

                using (var decryptor = aes.CreateDecryptor(aes.Key, aes.IV))
                using (var ms = new MemoryStream(buffer, aes.IV.Length, buffer.Length - aes.IV.Length))
                using (var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read))
                using (var sr = new StreamReader(cs))
                {
                    return sr.ReadToEnd();
                }
            }
        }
    }
}
```

```csharp
// Backend/src/UabIndia.Core/Entities/User.cs - Update properties
using UabIndia.Core.Services;

public class User : AuditableEntity
{
    private string _email;
    private string _phoneNumber;
    
    public string Email
    {
        get => EncryptionService.Decrypt(_email);
        set => _email = EncryptionService.Encrypt(value);
    }

    public string PhoneNumber
    {
        get => EncryptionService.Decrypt(_phoneNumber);
        set => _phoneNumber = EncryptionService.Encrypt(value);
    }

    // ... other properties
}
```

---

### Task 8: SameSite Cookie Configuration ✅

```csharp
// Backend/src/UabIndia.Api/Controllers/AuthController.cs - Update Login method

var cookieOptions = new CookieOptions
{
    HttpOnly = true,
    Secure = true, // HTTPS only
    SameSite = SameSiteMode.Strict,
    Expires = DateTimeOffset.UtcNow.AddDays(30)
};

Response.Cookies.Append("accessToken", accessToken, new CookieOptions
{
    HttpOnly = true,
    Secure = true,
    SameSite = SameSiteMode.Strict,
    Expires = DateTimeOffset.UtcNow.AddMinutes(15)
});

Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
```

---

## ✅ VALIDATION CHECKLIST

- [ ] SecurityHeadersMiddleware compiles and runs
- [ ] HSTS header present (verified via browser DevTools)
- [ ] Token revocation working (test logout invalidates token)
- [ ] FluentValidation rejects invalid inputs
- [ ] Error responses use ErrorCode enum
- [ ] Rate limiting returns 429 status
- [ ] CSRF tokens generated and validated
- [ ] PII fields encrypted in database
- [ ] SameSite=Strict cookies set
- [ ] No secrets in code (use appsettings.json)
- [ ] Logging includes security events
- [ ] All tests passing

---

## 🧪 TESTING COMMANDS

```bash
# Test rate limiting
for i in {1..10}; do curl -X POST http://localhost:5000/api/v1/auth/login; done

# Test HSTS header
curl -I http://localhost:5000/api/v1/health

# Test token revocation
curl -X POST http://localhost:5000/api/v1/auth/logout \
  -H "Authorization: Bearer $TOKEN"

# Test validation
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid","password":"weak"}'
```

---

## 📊 PROGRESS TRACKING

| Task | Status | Assigned | Due Date |
|------|--------|----------|----------|
| SecurityHeadersMiddleware | Not Started | Backend Lead | Day 1 |
| Token Revocation | Not Started | Backend Lead | Day 2 |
| FluentValidation | Not Started | Backend Lead | Day 2 |
| Error Responses | Not Started | Backend Lead | Day 1 |
| Rate Limiting | Not Started | Backend Lead | Day 1 |
| CSRF Tokens | Not Started | Full Stack | Day 3 |
| PII Encryption | Not Started | Backend Lead | Day 3 |
| SameSite Cookies | Not Started | Backend Lead | Day 1 |
| Testing | Not Started | QA | Day 4 |
| Documentation | Not Started | Tech Lead | Day 4 |

---

**Total Estimated Hours:** 40 hours (5 days)  
**Team Required:** 1 Backend Lead + 1 QA Engineer  
**Blocker Items:** None  
**Dependencies:** None

Next: Sprint 2 - State Management & Performance Optimization
