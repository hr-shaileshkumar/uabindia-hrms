<#
Update README badges by replacing OWNER/REPO placeholders with detected git remote origin.
Usage:
  From repo root: .\scripts\update-readme-badges.ps1

This will detect `remote.origin.url`, extract `owner/repo` and replace occurrences of OWNER/REPO
in README.md and Backend/README.md.
#>

param()

function ExitErr($m){ Write-Host $m -ForegroundColor Red; exit 1 }

if (-not (Get-Command git -ErrorAction SilentlyContinue)) { ExitErr "git not found in PATH." }

$remote = (git config --get remote.origin.url) -as [string]
if (-not $remote) { ExitErr "remote.origin.url not set. Set remote and try again." }

# parse git remote (supports SSH and HTTPS)
if ($remote -match 'github.com[:/](.+?)/(.*?)(?:\.git)?$'){
    $owner = $matches[1]
    $repo = $matches[2]
    $slug = "$owner/$repo"
} else {
    ExitErr "Unsupported remote format: $remote"
}

Write-Host "Detected repo: $slug"

function Replace-InFile($path){
    if (-not (Test-Path $path)) { return }
    $text = Get-Content $path -Raw
    $new = $text -replace 'OWNER/REPO', [Regex]::Escape($slug)
    if ($new -ne $text) {
        $bak = "$path.bak"
        Copy-Item $path $bak -Force
        Set-Content $path $new -Force
        Write-Host "Updated $path (backup at $bak)"
    } else {
        Write-Host "No OWNER/REPO placeholders found in $path"
    }
}

Replace-InFile "README.md"
Replace-InFile "Backend/README.md"

Write-Host "Badge replacement complete. Commit the updated files if desired."
