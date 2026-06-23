# Load Test Plan

## Goal
Validate 100+ concurrent users with acceptable latency (<3s voice pipeline p95).

## Tools
- k6 or Artillery for API load
- Custom WebSocket script for Reverb channels

## Scenarios

### 1. Auth burst
- 200 login requests over 60s
- Expect: <500ms p95, no 5xx

### 2. Resume upload
- 50 concurrent PDF uploads (2MB each)
- Expect: queue accepts all, ParseResumeJob completes within 2min

### 3. Interview session
- 100 concurrent sessions starting interviews
- 1 answer submission every 30s per session for 10 minutes
- Expect: EvaluateAnswerJob queue depth < 500, p95 eval < 5s

### 4. WebSocket
- 100 concurrent Reverb connections
- Verify question.generated and answer.evaluated delivery < 1s after job complete

## Infrastructure Targets
- 4 queue workers
- 2 FastAPI uvicorn workers
- Dedicated Ollama GPU instance
- Redis for cache + Reverb scaling

## Pass Criteria
- Error rate < 1%
- API p95 < 2s (excluding AI)
- Voice pipeline p95 < 3s with Whisper base model
- No duplicate scores for same idempotency_key
