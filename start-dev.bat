@echo off
setlocal

set "ROOT=%~dp0"

echo Starting Mock Interview Pro development services...
echo Ensure Laragon Redis is already running.

start "Laravel API" cmd /k "cd /d ""%ROOT%backend"" && php artisan serve"
start "Queue - High and Default" cmd /k "cd /d ""%ROOT%backend"" && php artisan queue:work --queue=high,default"
start "Queue - Low" cmd /k "cd /d ""%ROOT%backend"" && php artisan queue:work --queue=low"
start "Laravel Scheduler" cmd /k "cd /d ""%ROOT%backend"" && php artisan schedule:work"
start "Laravel Reverb" cmd /k "cd /d ""%ROOT%backend"" && php artisan reverb:start"

if exist "%ROOT%ai-service\venv\Scripts\python.exe" (
    start "FastAPI AI Service" cmd /k "cd /d ""%ROOT%ai-service"" && venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8001"
) else (
    start "FastAPI AI Service" cmd /k "cd /d ""%ROOT%ai-service"" && python -m uvicorn app.main:app --reload --port 8001"
)

start "Next.js Frontend" cmd /k "cd /d ""%ROOT%frontend"" && npm run dev"
start "Ollama" cmd /k "ollama serve"

echo All service windows were opened.
endlocal
