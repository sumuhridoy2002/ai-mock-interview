# Mock Interview Pro — Project Rules

## Architecture
- **backend/** — Laravel API: auth, persistence, queues, WebSockets
- **frontend/** — Next.js 15 SPA: interview UI, WebRTC, Reverb client
- **ai-service/** — FastAPI: Ollama agents, Whisper STT (stateless)

## Conventions
- API prefix: `/api/v1`
- Sanctum bearer tokens for SPA auth
- All AI calls go through `AiGatewayService`, never direct from frontend
- Idempotency keys on answer submissions
- Sanitize user transcripts via `PromptSanitizer` before LLM calls

## Do Not
- Expose AI service publicly without `AI_SERVICE_SECRET`
- Store secrets in frontend env (except public Reverb key)
- Skip authorization policies on interview/resume routes
