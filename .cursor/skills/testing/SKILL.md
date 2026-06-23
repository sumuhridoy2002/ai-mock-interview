---
name: testing
description: Testing guidelines for mock-interview-pro.
---
# Testing

- Backend: PHPUnit in `backend/tests/` — auth flow, resume upload validation, idempotency
- Frontend: manual E2E — register, upload resume, start interview, submit answer
- AI service: `GET /health`, mock mode with `AI_USE_MOCK=true`
- Load test plan: `docs/load-test.md`
