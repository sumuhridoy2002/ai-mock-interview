# System Architecture

## Overview

Mock Interview Pro is a three-tier AI interview platform:

```
Browser → Next.js (PM2) → Laravel API → FastAPI AI Service → Ollama + Whisper
                ↕ Reverb WebSocket
```

## Components

| Component | Path | Role |
|-----------|------|------|
| Frontend | `frontend/` | Auth UI, dashboard, live interview room |
| Backend | `backend/` | REST API, queues, persistence, PDF reports |
| AI Service | `ai-service/` | CV/job analysis, questions, evaluation, STT |

## Data Flow — Live Interview

1. User starts interview → Laravel creates session + dispatches `GenerateQuestionJob`
2. AI generates question → saved to DB → `QuestionGenerated` event via Reverb
3. User records audio → POST answer with idempotency key
4. Optional: voice pipeline transcribes via Whisper
5. `EvaluateAnswerJob` scores answer → broadcasts `AnswerEvaluated`
6. Next question generated automatically
7. On complete → `GenerateReportJob` → PDF + JSON report

## Security

- Sanctum bearer tokens
- Rate limiting on auth and AI endpoints
- Prompt injection sanitization
- Private file storage for resumes/audio
- AI service protected by optional `X-AI-Secret` header

## Production (Ubuntu VPS)

```
Nginx :443
  /     → Next.js :3000 (PM2)
  /api  → Laravel :8000 (PHP-FPM)
  /reverb → Reverb :8080

Supervisor: queue workers, reverb, ai-service
Ollama: local GPU/CPU inference
```

See `deploy/` for configuration files.

## Scalability

- Horizontal FastAPI workers behind Nginx
- Multiple Laravel queue workers (priority: eval > report)
- Redis cache for CV/job analysis (24h TTL)
- Idempotency keys prevent duplicate evaluations
- Reverb cluster mode via Redis pub/sub at scale
