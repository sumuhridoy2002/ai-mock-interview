---
name: nextjs-frontend
description: Next.js 15 frontend for mock-interview-pro. Use when editing pages, components, hooks, or API client.
---
# Next.js Frontend

- App Router under `frontend/app/`
- API client: `frontend/lib/api.ts` with bearer token from localStorage
- WebSocket: `frontend/lib/websocket.ts` via Pusher protocol + Reverb
- Live interview hooks: `useMediaRecorder.ts`, `useInterviewSession.ts`
- Env: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_REVERB_*`
