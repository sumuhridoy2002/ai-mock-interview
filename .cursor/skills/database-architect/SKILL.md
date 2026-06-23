---
name: database-architect
description: Database schema and migrations for mock-interview-pro. Use when changing ERD or indexes.
---
# Database Architect

Tables: users, resumes, interviews, interview_sessions, interview_questions, interview_answers, interview_scores, interview_reports, agent_memories

Key indexes: resumes(file_hash), interview_answers(idempotency_key), interview_sessions(session_uuid)

Migrations in `backend/database/migrations/` prefixed `2024_06_01_*`
