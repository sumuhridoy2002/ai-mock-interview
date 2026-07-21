@echo off
setlocal

set "ROOT=%~dp0"
set "AI_DIR=%ROOT%ai-service"
set "VENV_PY=%AI_DIR%\venv\Scripts\python.exe"

echo Starting Mock Interview Pro development services...
echo Ensure Laragon Redis is already running.

if not exist "%VENV_PY%" (
    echo Creating ai-service virtual environment...
    pushd "%AI_DIR%"
    python -m venv venv
    popd
)

"%VENV_PY%" -m pip show uvicorn >nul 2>&1
if errorlevel 1 (
    echo Installing ai-service Python dependencies...
    "%VENV_PY%" -m pip install --upgrade pip setuptools
    "%VENV_PY%" -m pip install "uvicorn[standard]==0.34.0" "fastapi==0.115.6" "python-multipart==0.0.20" "pydantic==2.10.4" "pydantic-settings==2.7.1" "httpx==0.28.1"
    "%VENV_PY%" -m pip install -r "%AI_DIR%\requirements.txt"
)

start "Laravel API" cmd /k "cd /d ""%ROOT%backend"" && php artisan serve"
start "Queue - High and Default" cmd /k "cd /d ""%ROOT%backend"" && php artisan queue:work --queue=high,default"
start "Queue - Low" cmd /k "cd /d ""%ROOT%backend"" && php artisan queue:work --queue=low"
start "Laravel Scheduler" cmd /k "cd /d ""%ROOT%backend"" && php artisan schedule:work"
start "Laravel Reverb" cmd /k "cd /d ""%ROOT%backend"" && php artisan reverb:start"
start "FastAPI AI Service" cmd /k "cd /d ""%AI_DIR%"" && venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8001"
start "Next.js Frontend" cmd /k "cd /d ""%ROOT%frontend"" && npm run dev"
start "Ollama" cmd /k "ollama serve"

echo All service windows were opened.
endlocal
