# API Documentation

Base URL: `http://localhost:8000/api/v1`  
Auth: `Authorization: Bearer {token}`

## Authentication

### POST /register
```json
{ "name": "Jane", "email": "jane@example.com", "password": "secret", "password_confirmation": "secret" }
```
Response: `{ "user": {...}, "token": "..." }`

### POST /login
```json
{ "email": "jane@example.com", "password": "secret" }
```

### POST /logout
Requires auth. Returns `{ "message": "Logged out." }`

### GET /user
Returns `{ "user": {...} }`

## Resumes

### POST /resumes
`multipart/form-data` with `file` (PDF/DOCX, max 5MB)

### GET /resumes
Returns `{ "data": [Resume] }`

### GET /resumes/{id}
Returns `{ "id", "status", "parsed_profile", "original_filename" }`

## Interviews

### POST /interviews
```json
{
  "resume_id": 1,
  "job_title": "Senior Developer",
  "job_description": "...",
  "experience_level": "mid",
  "interview_type": "mixed"
}
```

### POST /interviews/{id}/start
Returns `{ "session_uuid", "reverb_channel" }`

### GET /interviews/{id}/current-question
Returns `{ "question_id", "question", "sequence", "category" }`

### POST /interviews/{id}/answers
`multipart/form-data`: `question_id`, `idempotency_key`, optional `audio`, `transcript`, `duration_seconds`

### GET /interviews/{id}/answers/{answerId}/score
Returns evaluation scores and feedback arrays.

### POST /interviews/{id}/complete
Triggers report generation.

### GET /interviews/{id}/report
Returns `{ "report", "overall_score", "hiring_recommendation", "pdf_url" }`

### GET /interviews/{id}/report/pdf
Downloads PDF file.

## WebSocket

Channel: `private-interview.{sessionUuid}`  
Auth: `POST /broadcasting/auth` with bearer token

Events:
- `question.generated`
- `answer.evaluated`
- `interview.completed`
