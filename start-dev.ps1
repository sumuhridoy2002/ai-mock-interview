# Start all Mock Interview Pro development services (one window each).
# Usage from project root:  .\start-dev.ps1

$Root = $PSScriptRoot

Write-Host "Starting Mock Interview Pro development services..."
Write-Host "Ensure Laragon Redis is already running."

$services = @(
    @{ Title = "Laravel API";           Dir = "backend";    Cmd = "php artisan serve" },
    @{ Title = "Queue - High and Default"; Dir = "backend"; Cmd = "php artisan queue:work --queue=high,default" },
    @{ Title = "Queue - Low";           Dir = "backend";    Cmd = "php artisan queue:work --queue=low" },
    @{ Title = "Laravel Scheduler";     Dir = "backend";    Cmd = "php artisan schedule:work" },
    @{ Title = "Laravel Reverb";         Dir = "backend";    Cmd = "php artisan reverb:start" },
    @{ Title = "Next.js Frontend";       Dir = "frontend";   Cmd = "npm run dev" },
    @{ Title = "Ollama";                 Dir = $Root;        Cmd = "ollama serve" }
)

foreach ($svc in $services) {
    $workDir = if ($svc.Dir -eq $Root) { $Root } else { Join-Path $Root $svc.Dir }
    Start-Process cmd -ArgumentList "/k", "cd /d `"$workDir`" && $($svc.Cmd)" -WindowStyle Normal
}

$aiDir = Join-Path $Root "ai-service"
$venvPython = Join-Path $aiDir "venv\Scripts\python.exe"
$aiCmd = if (Test-Path $venvPython) {
    "cd /d `"$aiDir`" && venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8001"
} else {
    "cd /d `"$aiDir`" && python -m uvicorn app.main:app --reload --port 8001"
}
Start-Process cmd -ArgumentList "/k", $aiCmd -WindowStyle Normal

Write-Host "All service windows were opened."
