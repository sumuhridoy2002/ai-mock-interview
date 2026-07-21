/** Copy for How It Works journey + runtime (SVG subs and HTML legends). */

export const JOURNEY_STEPS = [
  { n: 1, title: "Start", desc: "Open Mock Interview Pro in the browser." },
  { n: 2, title: "Register · Login", desc: "Sign in — Sanctum stores a bearer token." },
  { n: 3, title: "Dashboard · Profile", desc: "History, scores, theme, and account settings." },
  { n: 4, title: "Upload CV", desc: "PDF/DOCX parsed into skills and experience." },
  { n: 5, title: "Interview Setup", desc: "Job, level, type — start now or schedule." },
  { n: 6, title: "Schedule path", desc: "Pick a slot — browser alarm + email reminder." },
  { n: 7, title: "Live Interview", desc: "WebSocket questions, cam/mic, per-answer recording." },
  { n: 8, title: "AI Evaluation", desc: "Ollama scores answers; vision analyzes behavior." },
  { n: 9, title: "Results · Explain", desc: "Scores, behavior charts, STAR explain pages." },
  { n: 10, title: "PDF · Memory", desc: "Download report; mastered topics skipped next time." },
] as const;

export const RUNTIME_STEPS = [
  { n: 1, title: "Browser (Next.js)", desc: "Live room, MediaRecorder, media consent, speech preview." },
  { n: 2, title: "Laravel API + Sanctum", desc: "REST auth, interviews, uploads, job dispatch." },
  { n: 3, title: "Reverb WebSocket", desc: "Real-time questions and session events." },
  { n: 4, title: "MySQL", desc: "Scores, mastery, behaviors, video paths." },
  { n: 5, title: "Queue Worker", desc: "Evaluate, generate Qs, behavior, email jobs." },
  { n: 6, title: "FastAPI AI Service", desc: "Orchestrates LLM, STT, vision, PDF reports." },
  { n: 7, title: "Ollama · Whisper · Vision", desc: "Llama 3 scoring, Whisper STT, GPU behavior analysis." },
] as const;
