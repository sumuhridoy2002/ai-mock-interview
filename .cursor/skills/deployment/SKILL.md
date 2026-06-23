---
name: deployment
description: Production deployment for Ubuntu VPS with Nginx, PM2, Supervisor.
---
# Deployment

Configs in `deploy/`:
- `nginx/mock-interview.conf` — reverse proxy for Next.js, Laravel API, Reverb WS
- `supervisor/` — queue worker, reverb, ai-service

See `docs/architecture.md` for full production topology.
