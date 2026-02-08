Write-Host "This script bootstraps the .NET solution and projects using the existing csproj files."`n
# Run from repository root: ./Backend/scripts/create_solution_and_projects.ps1

$sln = "UabIndia.sln"
if (-Not (Test-Path $sln)) {
    dotnet new sln -n UabIndia
}

# Add projects if not present
$projects = @(
    "src\UabIndia.Api\UabIndia.Api.csproj",
    "src\UabIndia.Core\UabIndia.Core.csproj",
    "src\UabIndia.Application\UabIndia.Application.csproj",
    "src\UabIndia.Infrastructure\UabIndia.Infrastructure.csproj",
    "src\UabIndia.Identity\UabIndia.Identity.csproj",
    "src\UabIndia.SharedKernel\UabIndia.SharedKernel.csproj"
)

foreach ($p in $projects) {
    if (-Not (dotnet sln list | Select-String $p)) {
        dotnet sln add $p
    }
}

Write-Host "Solution and project references added. Run 'dotnet restore' then update connection string in src/UabIndia.Api/appsettings.Development.json' and apply migrations."