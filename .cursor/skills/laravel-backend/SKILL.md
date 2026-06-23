---
name: laravel-backend
description: Laravel API patterns for mock-interview-pro backend. Use when editing migrations, models, jobs, Sanctum auth, or API controllers.
---
# Laravel Backend

- Models in `backend/app/Models/` match ERD: Resume, Interview, InterviewSession, etc.
- Services in `backend/app/Services/Interview/`
- Jobs: ParseResumeJob, AnalyzeJobDescriptionJob, GenerateQuestionJob, EvaluateAnswerJob, GenerateReportJob
- Events broadcast on `private-interview.{sessionUuid}` channel
- Run `php artisan queue:work` for AI jobs
