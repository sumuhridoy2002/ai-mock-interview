# Start all Mock Interview Pro development services (one window each).
# Usage from project root:  .\start-dev.ps1

$Root = $PSScriptRoot
$AiDir = Join-Path $Root "ai-service"
$VenvPython = Join-Path $AiDir "venv\Scripts\python.exe"

function Ensure-AiServiceVenv {
    if (-not (Test-Path $VenvPython)) {
        Write-Host "Creating ai-service virtual environment..."
        Push-Location $AiDir
        python -m venv venv
        Pop-Location
    }

    $uvicornCheck = & $VenvPython -m pip show uvicorn 2>$null
    if (-not $uvicornCheck) {
        Write-Host "Installing ai-service Python dependencies (first run may take a few minutes)..."
        & $VenvPython -m pip install --upgrade pip setuptools
        & $VenvPython -m pip install "uvicorn[standard]==0.34.0" "fastapi==0.115.6" "python-multipart==0.0.20" "pydantic==2.10.4" "pydantic-settings==2.7.1" "httpx==0.28.1"
        & $VenvPython -m pip install -r (Join-Path $AiDir "requirements.txt")
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Full requirements.txt install had issues (Whisper/torch can be slow). Core server packages are installed; retry pip install -r requirements.txt in ai-service if AI features fail."
        }
    }
}

Write-Host "Starting Mock Interview Pro development services..."
Write-Host "Ensure Laragon Redis is already running."

Ensure-AiServiceVenv

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

$aiCmd = "cd /d `"$AiDir`" && venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8001"
Start-Process cmd -ArgumentList "/k", $aiCmd -WindowStyle Normal

Write-Host "All service windows were opened."
