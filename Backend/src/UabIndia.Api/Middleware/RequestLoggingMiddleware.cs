using System.Diagnostics;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace UabIndia.Api.Middleware
{
    public class RequestLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RequestLoggingMiddleware> _logger;

        public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task Invoke(HttpContext context)
        {
            var sw = Stopwatch.StartNew();
            await _next(context);
            sw.Stop();

            var userId = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? context.User?.FindFirst("sub")?.Value;

            var correlationId = context.Items["X-Correlation-Id"]?.ToString();

            _logger.LogInformation("HTTP {Method} {Path} responded {StatusCode} in {ElapsedMs} ms (UserId={UserId}, CorrelationId={CorrelationId})",
                context.Request.Method,
                context.Request.Path.Value,
                context.Response.StatusCode,
                sw.ElapsedMilliseconds,
                userId ?? "anonymous",
                correlationId ?? "n/a");
        }
    }
}
