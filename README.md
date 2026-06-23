# Mock Interview Pro

Production-ready AI mock interview platform.

## Stack

- **Backend:** Laravel 13 API (Sanctum, Reverb, Redis Queue)
- **Frontend:** Next.js 15 + TypeScript + Tailwind
- **AI:** Python FastAPI + Ollama + Whisper

## Start Dev Session

Run these 5 commands every time — one per terminal tab:

```bash
# Terminal 1 — Laravel API
cd backend && php artisan serve
```

```bash
# Terminal 2 — Queue worker (AI jobs, evaluations)
cd backend && php artisan queue:work
```

```bash
# Terminal 3 — WebSocket server (real-time questions)
cd backend && php artisan reverb:start
```

```bash
# Terminal 4 — AI service (Whisper + Ollama agents)
cd ai-service && venv\Scripts\activate && uvicorn app.main:app --reload --port 8001
```

```bash
# Terminal 5 — Frontend
cd frontend && npm run dev
```

> Open **http://localhost:3000** — all 5 must be running for full functionality.

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
php artisan serve
php artisan queue:work
php artisan reverb:start
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

Open http://localhost:3000

## Environment

| Variable | Location | Description |
|----------|----------|-------------|
| `AI_SERVICE_URL` | backend/.env | FastAPI URL (http://127.0.0.1:8001) |
| `AI_TRANSCRIBE_TIMEOUT` | backend/.env | Seconds to wait for transcription (default 300). Increase for `medium`/`large` on CPU. |
| `OLLAMA_URL` / `OLLAMA_MODEL` | ai-service env | Ollama endpoint and model for questions, scoring, and reports |
| `AI_USE_MOCK` | ai-service env | Set `true` only to skip Ollama calls entirely |
| `WHISPER_MODEL` | ai-service env | Whisper model size. `small` (default) is the best CPU/accuracy tradeoff. Use `medium` on a GPU-enabled VPS. |
| `WHISPER_LANGUAGE` | ai-service env | Language code for transcription (default `en`). Set explicitly to skip auto-detect. |
| `WHISPER_INITIAL_PROMPT` | ai-service env | Optional global vocabulary hint (e.g. `"Laravel, Eloquent, Sanctum, REST API"`). Per-interview context is sent automatically. |
| `FFMPEG_PATH` | ai-service env | Absolute path to ffmpeg binary. Falls back to system PATH then bundled `imageio-ffmpeg`. |
| `NEXT_PUBLIC_API_URL` | frontend/.env.local | Laravel API URL |
| `NEXT_PUBLIC_REVERB_*` | frontend/.env.local | WebSocket config |

### Whisper model guide

| Model | RAM | Speed on CPU | Accuracy |
|-------|-----|--------------|----------|
| `base` | ~1 GB | Fast | Lower |
| `small` | ~2 GB | Moderate | Good (default) |
| `medium` | ~5 GB | Slow | Better (use with GPU) |
| `large` | ~10 GB | Very slow | Best (GPU required) |

See [docs/architecture.md](docs/architecture.md) and [docs/api.md](docs/api.md).
