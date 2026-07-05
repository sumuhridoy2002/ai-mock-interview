/** Copy for How It Works journey + runtime (SVG subs and HTML legends). */

export const JOURNEY_STEPS = [
  { n: 1, title: "Start", desc: "Open Mock Interview Pro in the browser." },
  { n: 2, title: "Register · Login", desc: "Create an account or sign in. Laravel Sanctum issues a bearer token stored in the browser." },
  { n: 3, title: "Dashboard · Profile", desc: "Land on the dashboard. Sidebar shows your name, email, theme toggle, and interview history." },
  { n: 4, title: "Upload CV", desc: "Upload PDF/DOCX. Queue worker parses skills and experience into your profile." },
  { n: 5, title: "Interview Setup", desc: "Pick resume, job title, JD, level, and type. Choose Start Now or Schedule for Later." },
  { n: 6, title: "Schedule path", desc: "Pick date/time. Browser alarm banner fires at the slot; optional email reminder is queued." },
  { n: 7, title: "Live Interview", desc: "Cam/mic consent remembered. WebSocket delivers questions. Per-answer + full-session video recorded. Whisper transcribes speech." },
  { n: 8, title: "AI Evaluation", desc: "Ollama scores answers. Vision pipeline analyzes behavior. Mastery service records passed questions." },
  { n: 9, title: "Results · Explain", desc: "Review scores, behavior charts, and per-question STAR/timeline explain pages." },
  { n: 10, title: "PDF · Memory", desc: "Download PDF report. Cross-interview memory skips mastered questions on your next setup." },
] as const;

export const RUNTIME_STEPS = [
  { n: 1, title: "Browser (Next.js)", desc: "UI, live room, MediaRecorder (per-answer + full session), media consent in localStorage, Web Speech preview." },
  { n: 2, title: "Laravel API + Sanctum", desc: "REST auth, interviews, resumes, reports, recording upload, dispatches queue jobs." },
  { n: 3, title: "Reverb WebSocket", desc: "Pushes questions and session events to the client in real time." },
  { n: 4, title: "MySQL", desc: "Users, interviews, scores, resumes, user_question_mastery, user_memory_profiles, answer_behaviors, video paths." },
  { n: 5, title: "Queue Worker", desc: "Evaluate answers, generate questions, AnalyzeBehaviorJob, mastery updates, email reminders." },
  { n: 6, title: "FastAPI AI Service", desc: "Orchestrates LLM, STT, vision, and PDF report generation." },
  { n: 7, title: "Ollama · Whisper · Vision", desc: "Local Llama 3 for Q&A scoring; Whisper STT; GPU vision for emotion, gaze, prosody, coaching narrative." },
] as const;
