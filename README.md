# Mock Interview Pro

Production-ready AI mock interview platform.

## Stack

- **Backend:** Laravel 13 API (Sanctum, Reverb, Redis Queue)
- **Frontend:** Next.js 15 + TypeScript + Tailwind
- **AI:** Python FastAPI + Ollama + Whisper

## Start Dev Session

**Prerequisite (Laragon):** start **Redis** once from the Laragon tray — **Menu → Redis → Start**. Do not run `redis-server` in a terminal if Laragon already started it (port 6379 will be in use). Verify with `redis-cli ping` → `PONG`. The backend uses `REDIS_CLIENT=predis` (pure PHP) so you do not need the `phpredis` PHP extension.

Run these 6 commands every time — one per terminal tab:

```bash
# Terminal 1 — Laravel API
cd backend
php artisan serve
```

```bash
# Terminal 2 — Queue worker (AI jobs, evaluations, emails)
cd backend
php artisan queue:work
```

```bash
# Terminal 3 — Scheduler (interview email reminders, every minute)
cd backend
php artisan schedule:work
```

```bash
# Terminal 4 — WebSocket server (real-time questions)
cd backend
php artisan reverb:start
```

```bash
# Terminal 5 — AI service (Whisper + Ollama agents)
cd ai-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

```bash
# Terminal 6 — Frontend
cd frontend
npm run dev
```

```bash
# Terminal 7 — Ollama AI Provider
ollama serve
```

> Open **[http://localhost:3000](http://localhost:3000)** — Laragon Redis + all 6 terminals must be running for full functionality.

---

## Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env
php artisan key:generate
# Configure MySQL in .env or use sqlite (default)
touch database/database.sqlite  # if using sqlite
php artisan migrate
# Laragon: Menu → Redis → Start (required for CACHE_STORE=redis / SESSION_DRIVER=redis)
php artisan serve
php artisan queue:work
php artisan schedule:work   # dev — interview email reminders (10 min before)
php artisan reverb:start
```

**Production:** add a cron entry so reminders run every minute:

```bash
* * * * * cd /path/to/backend && php artisan schedule:run >> /dev/null 2>&1
```

### 2. AI Service

```bash
cd ai-service
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
# For full AI scoring and question generation (recommended):
set AI_USE_MOCK=false
set OLLAMA_URL=http://127.0.0.1:11434
set OLLAMA_MODEL=llama3:latest
# Start Ollama separately: ollama serve && ollama pull llama3
uvicorn app.main:app --reload --port 8001
```

Without Ollama, the app still runs using smarter offline heuristics for questions and scoring, but feedback quality is best with Ollama running.

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment


| Variable                      | Location            | Description                                                                                                                   |
| ----------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `AI_SERVICE_URL`              | backend/.env        | FastAPI URL ([http://127.0.0.1:8001](http://127.0.0.1:8001))                                                                  |
| `AI_TRANSCRIBE_TIMEOUT`       | backend/.env        | Seconds to wait for transcription (default 300). Increase for `medium`/`large` on CPU.                                        |
| `OLLAMA_URL` / `OLLAMA_MODEL` | ai-service env      | Ollama endpoint and model for questions, scoring, and reports                                                                 |
| `AI_USE_MOCK`                 | ai-service env      | Set `true` only to skip Ollama calls entirely                                                                                 |
| `WHISPER_MODEL`               | ai-service env      | Whisper model size. `small` (default) is the best CPU/accuracy tradeoff. Use `medium` on a GPU-enabled VPS.                   |
| `WHISPER_LANGUAGE`            | ai-service env      | Language code for transcription (default `en`). Set explicitly to skip auto-detect.                                           |
| `WHISPER_INITIAL_PROMPT`      | ai-service env      | Optional global vocabulary hint (e.g. `"Laravel, Eloquent, Sanctum, REST API"`). Per-interview context is sent automatically. |
| `FFMPEG_PATH`                 | ai-service env      | Absolute path to ffmpeg binary. Falls back to system PATH then bundled `imageio-ffmpeg`.                                      |
| `NEXT_PUBLIC_API_URL`         | frontend/.env.local | Laravel API URL                                                                                                               |
| `NEXT_PUBLIC_REVERB_*`        | frontend/.env.local | WebSocket config                                                                                                              |
| `FRONTEND_URL`                | backend/.env        | Next.js app URL for links in welcome and reminder emails (default `http://localhost:3000`)                                    |
| `MAIL_MAILER`                 | backend/.env        | `log` for dev (emails in `storage/logs/laravel.log`); use `smtp` in production                                                |
| `MAIL_HOST` / `MAIL_PORT`     | backend/.env        | SMTP server when `MAIL_MAILER=smtp`                                                                                           |


### Whisper model guide


| Model    | RAM    | Speed on CPU | Accuracy              |
| -------- | ------ | ------------ | --------------------- |
| `base`   | ~1 GB  | Fast         | Lower                 |
| `small`  | ~2 GB  | Moderate     | Good (default)        |
| `medium` | ~5 GB  | Slow         | Better (use with GPU) |
| `large`  | ~10 GB | Very slow    | Best (GPU required)   |


See [docs/architecture.md](docs/architecture.md) and [docs/api.md](docs/api.md).

### Reset database and uploads

```powershell
.\scripts\fresh-db.ps1
```

### Demo data (20 completed interviews)

Seed realistic completed interviews for the test user — scores, PDF reports, behavior summaries, snapshot galleries, and a playable full-session MP4 (no live recording required):

```powershell
cd backend
php artisan db:seed
php artisan interviews:seed-demo --count=20 --email=test@example.com
```

Options:

- `--fresh` — delete existing interviews for that user first
- `--no-pdf` — skip PDF generation (faster)
- `--count=20` — number of interviews (max 100)

Log in as `test@example.com` / `password`, then open the dashboard and any result page.

### Full browser journey (Playwright)

Requires Laragon Redis, and all dev services running (API, queue, scheduler, Reverb, AI service, frontend).

**Headed** (browser visible):

```bash
cd frontend
npm run test:e2e:journey
```

**Headless**:

```bash
cd frontend
npm run test:e2e:journey:headless
```

This registers, logs in, uploads a resume, completes an instant interview, schedules one ~~2 minutes ahead, waits for the alarm banner, completes that interview, and logs out (~~5–8 minutes).