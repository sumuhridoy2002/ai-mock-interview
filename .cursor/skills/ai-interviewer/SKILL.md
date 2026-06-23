---
name: ai-interviewer
description: FastAPI AI agent system with Ollama and Whisper. Use when editing agents, prompts, or voice pipeline.
---
# AI Interviewer Service

- Entry: `ai-service/app/main.py`
- Agents: cv_analyzer, job_analyzer, question_generator, evaluator, memory, report_generator
- Prompts: `ai-service/app/prompts/` optimized for Llama JSON output
- Voice pipeline: `ai-service/app/pipelines/voice.py` — STT + parallel eval/question gen
- Set `AI_USE_MOCK=true` for dev without Ollama/Whisper
