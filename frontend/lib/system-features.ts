export type FeatureStatus = "shipped" | "beta";

export interface SystemFeature {
  id: string;
  category: string;
  title: string;
  description: string;
  details?: string[];
  status: FeatureStatus;
  stack?: string[];
  apiRoute?: string;
}

export const FEATURE_CATEGORIES = [
  "Authentication & accounts",
  "Resume & CV intelligence",
  "Job description analysis",
  "Interview setup & scheduling",
  "Live interview room",
  "Question generation & deduplication",
  "Cross-interview memory & mastery",
  "Answer capture & transcription",
  "AI evaluation & scoring",
  "Vision & behavior analysis",
  "Reports, PDF & explanations",
  "Real-time & notifications",
  "Background jobs & queues",
  "System monitoring & dev tooling",
  "Security & privacy",
  "Deployment & self-hosting",
] as const;

export const SYSTEM_FEATURES: SystemFeature[] = [
  // Authentication & accounts
  {
    id: "auth-register",
    category: "Authentication & accounts",
    title: "Email registration",
    description:
      "Users create an account with name, email, and password. Credentials are validated server-side and passwords are hashed before storage.",
    status: "shipped",
    stack: ["Laravel", "Sanctum"],
    apiRoute: "POST /api/register",
  },
  {
    id: "auth-login",
    category: "Authentication & accounts",
    title: "Token-based login",
    description:
      "Login issues a Laravel Sanctum personal access token that the Next.js client stores and attaches to every authenticated request.",
    status: "shipped",
    stack: ["Laravel", "Sanctum"],
    apiRoute: "POST /api/login",
  },
  {
    id: "auth-logout",
    category: "Authentication & accounts",
    title: "Logout & token revocation",
    description:
      "Logging out revokes the active access token on the server so the session cannot be reused, and clears stored client state.",
    status: "shipped",
    stack: ["Laravel", "Sanctum"],
    apiRoute: "POST /api/logout",
  },
  {
    id: "auth-profile",
    category: "Authentication & accounts",
    title: "Profile & account settings",
    description:
      "Authenticated users can view and update their profile details. The current user is fetched once and cached client-side with an ETag to avoid redundant requests.",
    details: ["ETag caching via mip_user_etag", "Cached user profile in localStorage"],
    status: "shipped",
    stack: ["Laravel", "Next.js"],
    apiRoute: "GET /api/user",
  },
  {
    id: "auth-guard",
    category: "Authentication & accounts",
    title: "Protected routes & guards",
    description:
      "Dashboard pages are wrapped in an auth shell that redirects unauthenticated visitors to login, keeping interview data behind a token.",
    status: "shipped",
    stack: ["Next.js", "Sanctum"],
  },

  // Resume & CV intelligence
  {
    id: "resume-upload",
    category: "Resume & CV intelligence",
    title: "Resume upload",
    description:
      "Candidates upload a PDF or document CV. The file is validated for type and size and stored for parsing.",
    status: "shipped",
    stack: ["Laravel", "Storage"],
    apiRoute: "POST /api/resumes",
  },
  {
    id: "resume-parse",
    category: "Resume & CV intelligence",
    title: "Resume parsing & extraction",
    description:
      "Uploaded resumes are parsed to extract skills, experience, and education so the AI can tailor questions to the candidate's real background.",
    status: "shipped",
    stack: ["Laravel", "FastAPI"],
  },
  {
    id: "resume-skills",
    category: "Resume & CV intelligence",
    title: "Skill detection",
    description:
      "Detected skills become signals for question generation, ensuring the interview probes technologies the candidate actually claims.",
    status: "shipped",
    stack: ["FastAPI"],
  },
  {
    id: "resume-reuse",
    category: "Resume & CV intelligence",
    title: "Reusable resume profile",
    description:
      "A parsed resume is stored against the account so it can seed multiple interviews without re-uploading each time.",
    status: "shipped",
    stack: ["Laravel", "MySQL"],
  },

  // Job description analysis
  {
    id: "jd-input",
    category: "Job description analysis",
    title: "Job description input",
    description:
      "Candidates paste a target job description so questions reflect the specific role, seniority, and required competencies.",
    status: "shipped",
    stack: ["Next.js", "Laravel"],
  },
  {
    id: "jd-role-aware",
    category: "Job description analysis",
    title: "Role-aware question targeting",
    description:
      "The role and level extracted from the job description steer topic selection and difficulty, so a senior backend role and a junior frontend role get different interviews.",
    status: "shipped",
    stack: ["FastAPI", "Ollama"],
  },
  {
    id: "jd-gap",
    category: "Job description analysis",
    title: "Resume-to-role matching",
    description:
      "The candidate's resume is compared against the job description to focus questions on the areas that matter most for the target position.",
    status: "shipped",
    stack: ["FastAPI"],
  },

  // Interview setup & scheduling
  {
    id: "setup-config",
    category: "Interview setup & scheduling",
    title: "Interview configuration",
    description:
      "Before starting, candidates choose role, focus, and question count, giving them control over the length and shape of the session.",
    status: "shipped",
    stack: ["Next.js", "Laravel"],
    apiRoute: "POST /api/interviews",
  },
  {
    id: "setup-schedule",
    category: "Interview setup & scheduling",
    title: "Interview scheduling",
    description:
      "Interviews can be scheduled for a future time instead of starting immediately, with the scheduled time stored on the interview record.",
    status: "shipped",
    stack: ["Laravel", "MySQL"],
  },
  {
    id: "setup-reminders",
    category: "Interview setup & scheduling",
    title: "Scheduled reminders",
    description:
      "Upcoming interviews trigger browser and email reminders so candidates do not miss a scheduled session.",
    status: "shipped",
    stack: ["Laravel Queue", "Mail"],
  },
  {
    id: "setup-history",
    category: "Interview setup & scheduling",
    title: "Interview history",
    description:
      "Every interview is listed with status and outcome so candidates can track progress over time and revisit past sessions.",
    status: "shipped",
    stack: ["Laravel", "Next.js"],
    apiRoute: "GET /api/interviews",
  },

  // Live interview room
  {
    id: "live-room",
    category: "Live interview room",
    title: "Live interview room",
    description:
      "A focused interview UI presents one question at a time, the candidate's camera feed, recording controls, and live caption preview.",
    status: "shipped",
    stack: ["Next.js"],
  },
  {
    id: "live-camera",
    category: "Live interview room",
    title: "Camera & microphone capture",
    description:
      "The room acquires a camera and microphone stream via getUserMedia and renders the candidate's video so they can see themselves as in a real interview.",
    status: "shipped",
    stack: ["Browser MediaStream"],
  },
  {
    id: "live-consent",
    category: "Live interview room",
    title: "Persistent media consent",
    description:
      "Camera and microphone permission is requested only once. On later visits the app silently re-acquires the stream using the Permissions API plus a localStorage flag, so candidates are not re-prompted every interview or reload.",
    details: ["mi_media_consent localStorage flag", "Permissions API query", "Silent auto getUserMedia on mount"],
    status: "shipped",
    stack: ["Permissions API", "localStorage"],
  },
  {
    id: "live-stt-preview",
    category: "Live interview room",
    title: "Live caption preview",
    description:
      "While answering, the browser Web Speech API shows a live caption preview so candidates can confirm their speech is being heard. Final transcription is still done server-side for accuracy.",
    status: "shipped",
    stack: ["Web Speech API"],
  },
  {
    id: "live-tts",
    category: "Live interview room",
    title: "Spoken questions (TTS)",
    description:
      "Questions can be read aloud so the experience feels conversational rather than a text quiz.",
    status: "shipped",
    stack: ["Browser SpeechSynthesis"],
  },
  {
    id: "live-progress",
    category: "Live interview room",
    title: "Question progress indicator",
    description:
      "A progress indicator shows how many questions remain so candidates can pace themselves through the session.",
    status: "shipped",
    stack: ["Next.js"],
  },

  // Question generation & deduplication
  {
    id: "q-generate",
    category: "Question generation & deduplication",
    title: "AI question generation",
    description:
      "Questions are generated by a local LLM using the candidate's resume, the job description, and the interview phase to produce relevant, personalized prompts.",
    status: "shipped",
    stack: ["FastAPI", "Ollama"],
    apiRoute: "POST /agents/questions/generate",
  },
  {
    id: "q-opening-followup",
    category: "Question generation & deduplication",
    title: "Opening & follow-up phases",
    description:
      "The generator distinguishes opening questions from follow-ups, so later questions can dig deeper based on what was already discussed.",
    status: "shipped",
    stack: ["FastAPI", "Ollama"],
  },
  {
    id: "q-dedupe-session",
    category: "Question generation & deduplication",
    title: "In-interview deduplication",
    description:
      "Questions already asked in the current interview are tracked and excluded so the same prompt never appears twice in one session.",
    status: "shipped",
    stack: ["Laravel", "FastAPI"],
  },
  {
    id: "q-fallback",
    category: "Question generation & deduplication",
    title: "Role-aware fallback questions",
    description:
      "If the model returns an unusable or duplicate question, a curated role-aware fallback is substituted so the interview never stalls.",
    status: "shipped",
    stack: ["Laravel", "FastAPI"],
  },
  {
    id: "q-normalize",
    category: "Question generation & deduplication",
    title: "Question normalization",
    description:
      "Question text is normalized to a canonical form before comparison, so trivial wording differences do not let a near-identical question slip through.",
    status: "shipped",
    stack: ["Laravel"],
  },

  // Cross-interview memory & mastery
  {
    id: "mem-mastery-skip",
    category: "Cross-interview memory & mastery",
    title: "Never re-ask passed questions",
    description:
      "When a candidate answers a question well (overall score at or above the mastery threshold of 60), it is recorded as mastered and is never asked again in any future interview.",
    details: ["Mastery threshold 60", "Stored in user_question_mastery", "Both topic and exact text are de-duplicated"],
    status: "shipped",
    stack: ["Laravel", "MySQL"],
  },
  {
    id: "mem-topic-mastery",
    category: "Cross-interview memory & mastery",
    title: "Topic mastery memory",
    description:
      "Beyond individual questions, mastered topics are remembered so the generator avoids re-testing areas the candidate has already demonstrated.",
    status: "shipped",
    stack: ["Laravel", "MySQL"],
  },
  {
    id: "mem-profile",
    category: "Cross-interview memory & mastery",
    title: "Rolling user memory profile",
    description:
      "A per-user profile aggregates mastered topics, strengths, weaknesses, and a running summary across all interviews completed.",
    details: ["Stored in user_memory_profiles", "Tracks interviews_completed"],
    status: "shipped",
    stack: ["Laravel", "MySQL"],
  },
  {
    id: "mem-ai-context",
    category: "Cross-interview memory & mastery",
    title: "Memory shared with the AI",
    description:
      "On every new interview the memory profile is sent to the AI generator, so questions build on prior strengths and weaknesses instead of starting from scratch.",
    status: "shipped",
    stack: ["FastAPI", "Ollama"],
    apiRoute: "POST /agents/questions/generate",
  },
  {
    id: "mem-mastery-service",
    category: "Cross-interview memory & mastery",
    title: "Mastery service",
    description:
      "A dedicated service records mastery after each answer is scored and refreshes the memory profile, keeping the cross-interview state consistent.",
    status: "shipped",
    stack: ["Laravel"],
  },

  // Answer capture & transcription
  {
    id: "ans-record",
    category: "Answer capture & transcription",
    title: "Per-answer recording",
    description:
      "Each answer is captured as an audio/video clip via the browser MediaRecorder and uploaded for transcription and scoring.",
    status: "shipped",
    stack: ["Browser MediaRecorder"],
  },
  {
    id: "ans-full-recording",
    category: "Answer capture & transcription",
    title: "Full-session video recording",
    description:
      "A separate continuous recorder captures the entire interview as one video and uploads it when the interview ends, producing a complete archive of the session.",
    details: ["Stored as full_video_path on the interview"],
    status: "shipped",
    stack: ["Browser MediaRecorder", "Laravel"],
    apiRoute: "POST /api/interviews/{id}/recording",
  },
  {
    id: "ans-whisper",
    category: "Answer capture & transcription",
    title: "Whisper transcription",
    description:
      "Uploaded answer audio is transcribed server-side with Whisper for accurate text that the evaluator can score, independent of the live browser preview.",
    status: "shipped",
    stack: ["FastAPI", "Whisper"],
  },
  {
    id: "ans-upload",
    category: "Answer capture & transcription",
    title: "Answer submission",
    description:
      "Recorded answers are submitted to the interview, queuing transcription, evaluation, mastery recording, and behavior analysis.",
    status: "shipped",
    stack: ["Laravel"],
    apiRoute: "POST /api/interviews/{id}/answers",
  },

  // AI evaluation & scoring
  {
    id: "eval-score",
    category: "AI evaluation & scoring",
    title: "AI answer evaluation",
    description:
      "Each answer is scored by the AI evaluator across multiple dimensions, producing an overall score plus structured feedback.",
    status: "shipped",
    stack: ["FastAPI", "Ollama"],
    apiRoute: "POST /agents/answers/evaluate",
  },
  {
    id: "eval-dimensions",
    category: "AI evaluation & scoring",
    title: "Multi-dimension scoring",
    description:
      "Scores break down into dimensions such as relevance, depth, and clarity rather than a single opaque number, making feedback actionable.",
    status: "shipped",
    stack: ["FastAPI"],
  },
  {
    id: "eval-async",
    category: "AI evaluation & scoring",
    title: "Asynchronous evaluation",
    description:
      "Scoring runs in a background job so candidates are not blocked while the model works, and results stream in as they complete.",
    status: "shipped",
    stack: ["Laravel Queue"],
  },
  {
    id: "eval-strengths",
    category: "AI evaluation & scoring",
    title: "Strengths & weaknesses extraction",
    description:
      "Evaluation surfaces specific strengths and weaknesses per answer, which also feed the cross-interview memory profile.",
    status: "shipped",
    stack: ["FastAPI"],
  },

  // Vision & behavior analysis
  {
    id: "vision-analyze",
    category: "Vision & behavior analysis",
    title: "Per-answer vision analysis",
    description:
      "Recorded answers are processed by a GPU vision pipeline that analyzes facial emotion, gaze, head pose, and blink rate frame by frame.",
    details: ["MediaPipe FaceMesh", "transformers emotion model", "OpenCV frame extraction"],
    status: "beta",
    stack: ["FastAPI", "MediaPipe", "OpenCV", "transformers"],
    apiRoute: "POST /pipeline/vision/analyze",
  },
  {
    id: "vision-confidence",
    category: "Vision & behavior analysis",
    title: "Confidence & nervousness scores",
    description:
      "Raw visual and audio signals are combined heuristically into confidence and nervousness scores that summarize on-camera presence.",
    status: "beta",
    stack: ["FastAPI"],
  },
  {
    id: "vision-emotion",
    category: "Vision & behavior analysis",
    title: "Facial emotion distribution",
    description:
      "Per-answer emotion is aggregated into a distribution (e.g. neutral, happy, fearful) so candidates can see how they came across.",
    status: "beta",
    stack: ["transformers"],
  },
  {
    id: "vision-eye-contact",
    category: "Vision & behavior analysis",
    title: "Eye contact & head stability",
    description:
      "Gaze direction and head pose are tracked to estimate eye-contact ratio and head stability, common signals of composure.",
    status: "beta",
    stack: ["MediaPipe"],
  },
  {
    id: "vision-prosody",
    category: "Vision & behavior analysis",
    title: "Audio prosody analysis",
    description:
      "The answer audio is analyzed for prosody (pace, pitch, energy) to complement the visual signals with how the candidate sounds.",
    status: "beta",
    stack: ["librosa", "soundfile"],
  },
  {
    id: "vision-coaching",
    category: "Vision & behavior analysis",
    title: "AI coaching narrative",
    description:
      "A local LLM turns the raw behavior metrics into a short, human-readable coaching note with concrete suggestions for the next interview.",
    status: "beta",
    stack: ["Ollama"],
  },
  {
    id: "vision-job",
    category: "Vision & behavior analysis",
    title: "Behavior analysis job",
    description:
      "A background job calls the vision API for each recorded answer and persists the results, keeping the candidate-facing flow fast.",
    details: ["Stored in answer_behaviors"],
    status: "beta",
    stack: ["Laravel Queue"],
  },

  // Reports, PDF & explanations
  {
    id: "report-summary",
    category: "Reports, PDF & explanations",
    title: "Interview report",
    description:
      "When an interview completes, a report aggregates per-question scores, strengths, weaknesses, and an overall outcome.",
    status: "shipped",
    stack: ["Laravel", "FastAPI"],
    apiRoute: "GET /api/interviews/{id}/report",
  },
  {
    id: "report-behavior",
    category: "Reports, PDF & explanations",
    title: "Behavior summary in reports",
    description:
      "The report includes an interview-wide presence summary covering confidence, nervousness, eye contact, and emotions aggregated across all answers.",
    details: ["AggregateBehaviorCard", "Per-question BehaviorPanel"],
    status: "beta",
    stack: ["Next.js", "Laravel"],
  },
  {
    id: "report-explain",
    category: "Reports, PDF & explanations",
    title: "Per-question explain pages",
    description:
      "Each question has a detailed explain view breaking down what was asked, how the answer scored, and how to improve, with a visual layout.",
    status: "shipped",
    stack: ["Next.js"],
  },
  {
    id: "report-pdf",
    category: "Reports, PDF & explanations",
    title: "PDF report export",
    description:
      "The full report, including behavior summary, can be exported as a PDF for offline review or sharing.",
    status: "shipped",
    stack: ["Laravel"],
  },
  {
    id: "report-narrative",
    category: "Reports, PDF & explanations",
    title: "Narrative feedback",
    description:
      "A generated narrative ties the numeric scores together into readable feedback rather than leaving candidates to interpret raw metrics.",
    status: "shipped",
    stack: ["FastAPI", "Ollama"],
  },

  // Real-time & notifications
  {
    id: "rt-websocket",
    category: "Real-time & notifications",
    title: "Real-time question delivery",
    description:
      "Generated questions and score updates are pushed to the live room over WebSockets so the UI updates instantly without polling.",
    status: "shipped",
    stack: ["Laravel Reverb", "Echo"],
  },
  {
    id: "rt-events",
    category: "Real-time & notifications",
    title: "Broadcast events",
    description:
      "Domain events such as answer-evaluated are broadcast so the frontend can react the moment background work finishes.",
    status: "shipped",
    stack: ["Laravel Broadcasting"],
  },
  {
    id: "rt-browser-notify",
    category: "Real-time & notifications",
    title: "Browser notifications",
    description:
      "Browser notifications alert candidates to scheduled interviews and important state changes even when the tab is in the background.",
    status: "shipped",
    stack: ["Notifications API"],
  },
  {
    id: "rt-email",
    category: "Real-time & notifications",
    title: "Email notifications",
    description:
      "Transactional emails cover scheduling reminders and key account events through Laravel's mail layer.",
    status: "shipped",
    stack: ["Laravel Mail"],
  },

  // Background jobs & queues
  {
    id: "job-queue",
    category: "Background jobs & queues",
    title: "Queue worker",
    description:
      "A queue worker runs heavy work — evaluation, question generation, behavior analysis, mastery writes, and email — off the request cycle.",
    status: "shipped",
    stack: ["Laravel Queue"],
  },
  {
    id: "job-generate",
    category: "Background jobs & queues",
    title: "Question generation job",
    description:
      "Question generation runs as a job that assembles the memory payload, calls the AI, and applies deduplication before persisting the question.",
    status: "shipped",
    stack: ["Laravel Queue"],
  },
  {
    id: "job-evaluate",
    category: "Background jobs & queues",
    title: "Answer evaluation job",
    description:
      "Answer evaluation runs as a job that scores the answer, records mastery, and dispatches behavior analysis when a video exists.",
    status: "shipped",
    stack: ["Laravel Queue"],
  },
  {
    id: "job-retry",
    category: "Background jobs & queues",
    title: "Resilient job handling",
    description:
      "Jobs log failures and degrade gracefully (for example falling back to curated questions) so a single AI hiccup does not break an interview.",
    status: "shipped",
    stack: ["Laravel Queue"],
  },

  // System monitoring & dev tooling
  {
    id: "sys-metrics",
    category: "System monitoring & dev tooling",
    title: "Performance metrics dashboard",
    description:
      "A metrics page tracks frontend and API performance against targets, with refresh and a rolling history of samples stored locally.",
    status: "shipped",
    stack: ["Next.js"],
  },
  {
    id: "sys-metric-docs",
    category: "System monitoring & dev tooling",
    title: "Metric calculation transparency",
    description:
      "Each metric documents exactly how it is computed and what is included or excluded, so numbers are never a black box.",
    status: "shipped",
    stack: ["Next.js"],
  },
  {
    id: "sys-stack",
    category: "System monitoring & dev tooling",
    title: "Architecture & stack explorer",
    description:
      "The stack page lists every component with its technology, role, and endpoint, including the newest memory, vision, and recording layers.",
    status: "shipped",
    stack: ["Next.js"],
  },
  {
    id: "sys-compare",
    category: "System monitoring & dev tooling",
    title: "Competitor comparison",
    description:
      "A comparison view contrasts Mock Interview Pro with popular tools across capability rows, highlighting memory, vision, and self-hosting advantages.",
    status: "shipped",
    stack: ["Next.js"],
  },
  {
    id: "sys-how",
    category: "System monitoring & dev tooling",
    title: "How-it-works walkthrough",
    description:
      "An architecture-and-flow page explains the end-to-end journey from resume upload to scored report for new users and reviewers.",
    status: "shipped",
    stack: ["Next.js"],
  },
  {
    id: "sys-features",
    category: "System monitoring & dev tooling",
    title: "Full feature catalog",
    description:
      "This catalog documents every capability with descriptions, status, stack, and API route, searchable and filterable by category.",
    status: "shipped",
    stack: ["Next.js"],
  },

  // Security & privacy
  {
    id: "sec-tokens",
    category: "Security & privacy",
    title: "Token authentication",
    description:
      "All API access is gated by Sanctum tokens, and sensitive routes require an authenticated, authorized user.",
    status: "shipped",
    stack: ["Laravel Sanctum"],
  },
  {
    id: "sec-validation",
    category: "Security & privacy",
    title: "Request validation",
    description:
      "Form requests validate and sanitize input — including uploaded media type and size — before anything touches storage or the database.",
    status: "shipped",
    stack: ["Laravel"],
  },
  {
    id: "sec-ownership",
    category: "Security & privacy",
    title: "Per-user data isolation",
    description:
      "Interviews, answers, recordings, and memory are scoped to their owner so one candidate can never read another's data.",
    status: "shipped",
    stack: ["Laravel"],
  },
  {
    id: "sec-consent",
    category: "Security & privacy",
    title: "Explicit media consent",
    description:
      "Camera and microphone access is only acquired after explicit user consent, and that choice is remembered rather than silently assumed.",
    status: "shipped",
    stack: ["Permissions API"],
  },
  {
    id: "sec-local-ai",
    category: "Security & privacy",
    title: "On-prem AI processing",
    description:
      "LLM, transcription, and vision all run on self-hosted services, so resumes, audio, and video are not sent to third-party AI vendors.",
    status: "shipped",
    stack: ["Ollama", "Whisper", "MediaPipe"],
  },

  // Deployment & self-hosting
  {
    id: "deploy-monorepo",
    category: "Deployment & self-hosting",
    title: "Monorepo architecture",
    description:
      "Backend (Laravel), frontend (Next.js), and AI service (FastAPI) live in one repository with clear boundaries, simplifying development and deployment.",
    status: "shipped",
    stack: ["Laravel", "Next.js", "FastAPI"],
  },
  {
    id: "deploy-selfhost",
    category: "Deployment & self-hosting",
    title: "Self-hosted deployment",
    description:
      "The full stack runs on a standard Ubuntu VPS with Nginx, PM2, and Supervisor, giving operators full control without vendor lock-in.",
    status: "shipped",
    stack: ["Nginx", "PM2", "Supervisor"],
  },
  {
    id: "deploy-gpu",
    category: "Deployment & self-hosting",
    title: "GPU-accelerated vision",
    description:
      "The vision pipeline uses available GPU acceleration for fast, accurate frame analysis on local hardware.",
    status: "beta",
    stack: ["FastAPI", "CUDA"],
  },
  {
    id: "deploy-queue-worker",
    category: "Deployment & self-hosting",
    title: "Supervised queue worker",
    description:
      "The background worker is supervised so it restarts automatically, keeping evaluation and vision jobs flowing in production.",
    status: "shipped",
    stack: ["Supervisor", "Laravel Queue"],
  },
  {
    id: "deploy-config",
    category: "Deployment & self-hosting",
    title: "Environment-driven configuration",
    description:
      "Tunables such as the mastery threshold and AI service URLs are driven by environment config, so behavior can change without code edits.",
    details: ["INTERVIEW_MASTERY_THRESHOLD", "AI service base URL"],
    status: "shipped",
    stack: ["Laravel"],
  },
];
