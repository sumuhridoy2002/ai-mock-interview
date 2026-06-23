# Reset database and remove uploaded resumes/CVs
$ErrorActionPreference = "Stop"
Set-Location "$PSScriptRoot\..\backend"

Write-Host "Running migrate:fresh..."
php artisan migrate:fresh --force

$resumesPath = "storage\app\private\resumes"
if (Test-Path $resumesPath) {
    Write-Host "Removing uploaded files in $resumesPath..."
    Get-ChildItem $resumesPath -Recurse -File | Remove-Item -Force
}

Write-Host "Clearing application cache..."
php artisan cache:clear 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Note: cache:clear skipped (ensure Redis is running via Laragon if you need cache cleared)."
}

Write-Host "Done. Database is fresh and resume storage is cleared."
