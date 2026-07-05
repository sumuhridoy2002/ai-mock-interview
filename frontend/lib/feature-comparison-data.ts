import type { FeatureComparisonEntry } from "./feature-comparison-types";

/** Narrative comparison: what each platform has vs lacks per capability. */
export const FEATURE_COMPARISON: FeatureComparisonEntry[] = [
  {
    feature: "CV-based personalized questions",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "Uploads PDF/DOCX resume, parses skills and experience, then generates questions from your job title and job description.",
        lacks: "No major gap — CV + JD drive every interview session.",
      },
      pramp: {
        level: "partial",
        has: "Peers can read your profile or LinkedIn before a live peer session.",
        lacks: "No automated resume parsing or AI questions tailored to a specific job posting.",
      },
      interviewingIo: {
        level: "partial",
        has: "Company-specific and role-themed question banks for paid mock sessions.",
        lacks: "Does not parse your uploaded CV to shape each question set.",
      },
      finalRoundAi: {
        level: "yes",
        has: "Uses resume and target role to generate AI mock interview questions.",
        lacks: "Cloud-only; no self-hosted CV pipeline or open parsing stack.",
      },
      hireVue: {
        level: "partial",
        has: "Employer-configured assessments may reference role competencies.",
        lacks: "Candidate-side CV upload with personalized AI question generation is not the default flow.",
      },
      googleWarmup: {
        level: "no",
        has: "Topic-based practice questions (e.g. leadership, technical themes).",
        lacks: "No resume upload, no job-description-driven personalization.",
      },
    },
  },
  {
    feature: "Voice + video answer capture",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "Records microphone audio and webcam video per answer during live interviews.",
        lacks: "No major gap — A/V capture is built into the live session flow.",
      },
      pramp: {
        level: "yes",
        has: "Live video calls with peers for mock interviews.",
        lacks: "No structured per-answer A/V archive tied to AI scoring in-app.",
      },
      interviewingIo: {
        level: "yes",
        has: "Video mock interviews with experienced interviewers.",
        lacks: "Not a self-captured async video pipeline with automated per-answer storage.",
      },
      finalRoundAi: {
        level: "partial",
        has: "Voice-based AI mock interviews in the browser.",
        lacks: "Limited full-session video archive and behavior pipeline compared to dedicated video products.",
      },
      hireVue: {
        level: "yes",
        has: "Enterprise video interviewing and async video responses.",
        lacks: "Geared toward employer assessments, not candidate-owned practice archives.",
      },
      googleWarmup: {
        level: "no",
        has: "Text and voice practice in the browser (no full interview recording).",
        lacks: "No video capture, no per-answer media archive.",
      },
    },
  },
  {
    feature: "AI scoring + PDF report",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "AI scores each answer, aggregates category scores, and generates a downloadable PDF report.",
        lacks: "No major gap — scoring and PDF export are core outputs.",
      },
      pramp: {
        level: "partial",
        has: "Peer feedback and ratings after sessions.",
        lacks: "No consistent AI rubric scoring or standardized PDF report export.",
      },
      interviewingIo: {
        level: "partial",
        has: "Human interviewer written feedback after mocks.",
        lacks: "No automated AI scoring engine or candidate PDF report download.",
      },
      finalRoundAi: {
        level: "yes",
        has: "AI-generated feedback and performance summaries after mocks.",
        lacks: "Reports are platform-locked; not a self-hosted scoring pipeline.",
      },
      hireVue: {
        level: "yes",
        has: "AI-assisted evaluation and employer-facing score reports.",
        lacks: "Reports belong to the hiring org, not an open candidate-owned PDF workflow.",
      },
      googleWarmup: {
        level: "no",
        has: "Lightweight hints while you practice answers.",
        lacks: "No numeric AI scores, no formal report, no PDF export.",
      },
    },
  },
  {
    feature: "Interview scheduling + reminders",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "Schedule interviews for a future date/time with in-app alarm and optional email reminder via queue worker.",
        lacks: "No major gap — schedule-or-start-now is built in.",
      },
      pramp: {
        level: "partial",
        has: "Calendar booking with peers for live sessions.",
        lacks: "No spoken in-app alarm or custom reminder message at practice time.",
      },
      interviewingIo: {
        level: "yes",
        has: "Books paid mock slots with human interviewers and email confirmations.",
        lacks: "Not a free self-serve schedule-with-alarm flow for solo AI practice.",
      },
      finalRoundAi: {
        level: "no",
        has: "Start AI mocks on demand.",
        lacks: "No calendar scheduling with timed reminders.",
      },
      hireVue: {
        level: "partial",
        has: "Employer-driven interview scheduling for candidates.",
        lacks: "No candidate-initiated practice scheduling with personal alarms.",
      },
      googleWarmup: {
        level: "no",
        has: "Practice anytime in the browser.",
        lacks: "No scheduling, no reminders.",
      },
    },
  },
  {
    feature: "Browser + email reminders",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "Browser alarm banner at scheduled time plus queued email reminder before the session.",
        lacks: "No major gap — dual reminder channels.",
      },
      pramp: {
        level: "no",
        has: "Standard calendar notifications from booking tools.",
        lacks: "No in-app spoken alarm or branded email reminder tied to mock prep.",
      },
      interviewingIo: {
        level: "partial",
        has: "Email confirmations for booked interviewer sessions.",
        lacks: "No in-browser alarm when it is time to start solo practice.",
      },
      finalRoundAi: {
        level: "no",
        has: "On-demand sessions only.",
        lacks: "No scheduled browser or email reminder workflow.",
      },
      hireVue: {
        level: "partial",
        has: "Email invites and deadline reminders from employers.",
        lacks: "No candidate practice alarm inside the product.",
      },
      googleWarmup: {
        level: "no",
        has: "Open the app when you want to practice.",
        lacks: "No email or browser reminders.",
      },
    },
  },
  {
    feature: "Self-hosted / open stack",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "Laravel + Next.js + FastAPI + Ollama + Whisper — deployable on your own VPS with full source control.",
        lacks: "No major gap — designed for self-hosting.",
      },
      pramp: { level: "no", has: "Fully managed SaaS peer-matching platform.", lacks: "Cannot self-host or audit the full stack." },
      interviewingIo: { level: "no", has: "Managed marketplace for human mocks.", lacks: "No open or self-hosted deployment." },
      finalRoundAi: { level: "no", has: "Cloud AI mock service.", lacks: "No on-prem or open-source stack." },
      hireVue: { level: "no", has: "Enterprise SaaS hiring platform.", lacks: "No self-hosted candidate practice environment." },
      googleWarmup: { level: "no", has: "Free Google-hosted practice tool.", lacks: "Not self-hostable; no source access." },
    },
  },
  {
    feature: "Real-time question delivery (WebSocket)",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "Laravel Reverb pushes questions and session events to the browser over WebSockets during live interviews.",
        lacks: "No major gap — real-time delivery is native.",
      },
      pramp: {
        level: "no",
        has: "Live human conversation over video.",
        lacks: "No WebSocket question stream from an orchestration backend.",
      },
      interviewingIo: {
        level: "yes",
        has: "Live human asks questions in real time over video.",
        lacks: "Not an automated WebSocket question pipeline from your own API.",
      },
      finalRoundAi: {
        level: "no",
        has: "Sequential AI prompts in the web UI.",
        lacks: "No Reverb-style real-time event channel you control.",
      },
      hireVue: {
        level: "partial",
        has: "Real-time or async flows depending on employer setup.",
        lacks: "No candidate-owned WebSocket interview orchestration.",
      },
      googleWarmup: {
        level: "no",
        has: "Static next-question flow in the UI.",
        lacks: "No WebSocket-backed live session layer.",
      },
    },
  },
  {
    feature: "Structured answer explanations (STAR/timeline)",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "Per-question breakdown pages with model answers, STAR-style structure, and visual timeline of a strong response.",
        lacks: "No major gap — explain pages are first-class.",
      },
      pramp: {
        level: "no",
        has: "Verbal peer feedback after the session.",
        lacks: "No structured STAR/timeline explain pages per question.",
      },
      interviewingIo: {
        level: "partial",
        has: "Interviewer may discuss answer structure in feedback.",
        lacks: "No standardized visual STAR breakdown for every question.",
      },
      finalRoundAi: {
        level: "partial",
        has: "AI suggests how to improve answer structure.",
        lacks: "No dedicated per-question visual timeline pages.",
      },
      hireVue: {
        level: "partial",
        has: "Rubrics may reference behavioral competencies.",
        lacks: "No candidate-facing STAR explain pages with visuals.",
      },
      googleWarmup: {
        level: "partial",
        has: "General tips on answer quality while practicing.",
        lacks: "No per-question structured breakdown archive.",
      },
    },
  },
  {
    feature: "Role-aware question fallbacks",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "Falls back to role- and level-appropriate questions when CV parsing or AI generation is slow.",
        lacks: "No major gap — fallbacks stay job-context aware.",
      },
      pramp: {
        level: "partial",
        has: "Peers choose or improvise questions during the call.",
        lacks: "No systematic role-aware fallback library tied to your JD.",
      },
      interviewingIo: {
        level: "partial",
        has: "Interviewers pick from role-themed banks.",
        lacks: "No automated fallback layer when AI or parsing fails.",
      },
      finalRoundAi: {
        level: "yes",
        has: "AI generates role-targeted questions from your inputs.",
        lacks: "Fallback logic is opaque and not self-hosted.",
      },
      hireVue: {
        level: "partial",
        has: "Employer-defined question sets per role.",
        lacks: "No candidate-controlled fallback when generation fails.",
      },
      googleWarmup: {
        level: "no",
        has: "Generic question pools by topic.",
        lacks: "No job-title-aware fallback questions.",
      },
    },
  },
  {
    feature: "Live performance monitoring",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "System metrics page tracks page load, API latency, app data size, and composite health scores vs industry standards.",
        lacks: "No major gap — live ops monitoring is built in.",
      },
      pramp: { level: "no", has: "Standard web app uptime.", lacks: "No candidate-visible performance dashboard." },
      interviewingIo: { level: "no", has: "Managed service reliability.", lacks: "No live performance metrics for users." },
      finalRoundAi: { level: "no", has: "Cloud-hosted AI mocks.", lacks: "No transparent latency or health dashboard." },
      hireVue: { level: "no", has: "Enterprise SLA-backed platform.", lacks: "No self-serve performance monitoring UI." },
      googleWarmup: { level: "no", has: "Google-operated infrastructure.", lacks: "No performance analytics for candidates." },
    },
  },
  {
    feature: "Never re-asks passed questions across interviews",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "Tracks mastery per question; skips items you already passed (≥ mastery threshold) in future interviews.",
        lacks: "No major gap — cross-session question memory is enforced.",
      },
      pramp: { level: "no", has: "New peer session each time.", lacks: "No mastery gate preventing repeat questions." },
      interviewingIo: { level: "no", has: "Human picks questions per booking.", lacks: "No automated pass/skip memory across your history." },
      finalRoundAi: { level: "no", has: "AI can generate new questions each run.", lacks: "No persistent never-repeat-passed logic." },
      hireVue: { level: "no", has: "Employer-controlled assessments.", lacks: "No cross-practice mastery memory for candidates." },
      googleWarmup: { level: "no", has: "Random practice questions.", lacks: "No pass tracking or skip-on-mastery." },
    },
  },
  {
    feature: "Cross-interview topic mastery memory",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "Remembers which topics you mastered and biases new interviews toward weak areas.",
        lacks: "No major gap — mastery persists across sessions.",
      },
      pramp: { level: "no", has: "Session-by-session peer practice.", lacks: "No topic mastery graph across interviews." },
      interviewingIo: { level: "no", has: "Feedback per mock only.", lacks: "No longitudinal topic mastery model." },
      finalRoundAi: {
        level: "partial",
        has: "May reference prior session context in paid tiers.",
        lacks: "No explicit mastery threshold or skip logic in your stack.",
      },
      hireVue: { level: "no", has: "Per-assessment evaluation.", lacks: "No candidate-owned mastery memory." },
      googleWarmup: { level: "no", has: "Independent practice rounds.", lacks: "No cross-session mastery tracking." },
    },
  },
  {
    feature: "AI context from prior strengths & weaknesses",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "Report aggregator feeds prior category scores and weak areas into the next interview context.",
        lacks: "No major gap — history informs the AI.",
      },
      pramp: { level: "no", has: "Peers do not see full score history automatically.", lacks: "No AI context from prior rubric scores." },
      interviewingIo: { level: "no", has: "Isolated mock feedback notes.", lacks: "No automated weakness-driven question steering." },
      finalRoundAi: {
        level: "partial",
        has: "Some continuity between AI sessions in product history.",
        lacks: "No open pipeline from your own stored reports.",
      },
      hireVue: { level: "no", has: "Employer assessment records.", lacks: "No candidate practice context chaining." },
      googleWarmup: { level: "no", has: "Stateless practice.", lacks: "No memory of strengths or weaknesses." },
    },
  },
  {
    feature: "Full-session interview video archive",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "Stores full-session and per-answer video for replay and report attachment.",
        lacks: "No major gap — recording archive is supported.",
      },
      pramp: { level: "no", has: "Live call only; typically not archived for you.", lacks: "No full-session video library." },
      interviewingIo: {
        level: "partial",
        has: "Some sessions may offer recordings depending on package.",
        lacks: "Not a default full-session archive for every mock.",
      },
      finalRoundAi: { level: "no", has: "Primarily audio/AI text flow.", lacks: "No complete session video vault." },
      hireVue: {
        level: "yes",
        has: "Records async and live video responses for employers.",
        lacks: "Videos belong to the employer, not your private practice library.",
      },
      googleWarmup: { level: "no", has: "Practice without persistent video.", lacks: "No session video archive." },
    },
  },
  {
    feature: "Per-answer video behavior analysis (confidence/nervousness)",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "Vision pipeline scores confidence, nervousness, and composure per answer from webcam frames.",
        lacks: "No major gap — behavior scoring is per answer.",
      },
      pramp: { level: "no", has: "Peer subjective impression only.", lacks: "No automated confidence/nervousness metrics." },
      interviewingIo: { level: "no", has: "Human observation during video.", lacks: "No CV-based behavior scoring." },
      finalRoundAi: { level: "no", has: "Text/voice answer analysis.", lacks: "No per-answer video behavior pipeline." },
      hireVue: {
        level: "partial",
        has: "Some products analyze tone and facial cues for hiring.",
        lacks: "Not exposed as candidate practice coaching per answer.",
      },
      googleWarmup: { level: "no", has: "No video behavior analysis.", lacks: "No confidence or nervousness scores." },
    },
  },
  {
    feature: "Facial emotion distribution in reports",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "Reports include emotion distribution charts from vision analysis across the interview.",
        lacks: "No major gap — emotions appear in PDF/report UI.",
      },
      pramp: { level: "no", has: "No emotion analytics.", lacks: "No facial emotion charts in reports." },
      interviewingIo: { level: "no", has: "Written feedback only.", lacks: "No emotion distribution metrics." },
      finalRoundAi: { level: "no", has: "Text-centric feedback.", lacks: "No facial emotion reporting." },
      hireVue: {
        level: "partial",
        has: "Enterprise analytics may include expression signals for hiring.",
        lacks: "Not a candidate practice report with emotion charts.",
      },
      googleWarmup: { level: "no", has: "No webcam emotion tracking.", lacks: "No emotion distribution in output." },
    },
  },
  {
    feature: "Eye contact + head stability metrics",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "Measures eye contact ratio and head stability per answer; feeds confidence score.",
        lacks: "No major gap — metrics are in the behavior pipeline.",
      },
      pramp: { level: "no", has: "Peer may comment informally.", lacks: "No quantified eye contact or head stability." },
      interviewingIo: { level: "no", has: "Human perception only.", lacks: "No automated gaze or stability metrics." },
      finalRoundAi: { level: "no", has: "No vision metrics.", lacks: "No eye contact or head stability scores." },
      hireVue: {
        level: "partial",
        has: "Some assessments track engagement proxies.",
        lacks: "No detailed gaze/stability coaching for self-practice.",
      },
      googleWarmup: { level: "no", has: "No vision analysis.", lacks: "No eye contact metrics." },
    },
  },
  {
    feature: "Audio prosody analysis",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "Analyzes pitch variation, pause patterns, and speaking pace from answer audio.",
        lacks: "No major gap — prosody feeds behavior scores.",
      },
      pramp: { level: "no", has: "Peer hears your delivery live.", lacks: "No automated prosody metrics." },
      interviewingIo: { level: "no", has: "Interviewer comments on delivery.", lacks: "No pitch/pause analytics." },
      finalRoundAi: { level: "no", has: "Transcript-based feedback.", lacks: "No prosody feature extraction." },
      hireVue: {
        level: "partial",
        has: "May analyze voice in enterprise assessments.",
        lacks: "Not a practice tool with open prosody breakdown.",
      },
      googleWarmup: { level: "no", has: "Basic voice practice.", lacks: "No prosody analysis in reports." },
    },
  },
  {
    feature: "AI coaching narrative from body language",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "Generates coaching text from vision + audio behavior signals (posture, gaze, tone, pauses).",
        lacks: "No major gap — narrative coaching is in reports.",
      },
      pramp: { level: "no", has: "Informal peer advice.", lacks: "No AI body-language coaching narrative." },
      interviewingIo: { level: "no", has: "Human-written feedback.", lacks: "No automated body-language coaching." },
      finalRoundAi: { level: "no", has: "Answer-content coaching.", lacks: "No vision-driven narrative." },
      hireVue: { level: "no", has: "Employer evaluation summaries.", lacks: "No candidate body-language coaching story." },
      googleWarmup: { level: "no", has: "Generic answer tips.", lacks: "No body-language AI narrative." },
    },
  },
  {
    feature: "Persistent camera/mic consent (no re-prompt every session)",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "Remembers media permission consent in the browser so repeat sessions skip the permission dialog when already granted.",
        lacks: "No major gap — consent persistence is implemented.",
      },
      pramp: {
        level: "partial",
        has: "Browser remembers device access until cleared.",
        lacks: "No app-level consent UX optimized for repeat mock prep.",
      },
      interviewingIo: {
        level: "partial",
        has: "Standard browser media permissions per call.",
        lacks: "No dedicated persistent consent layer in product.",
      },
      finalRoundAi: {
        level: "partial",
        has: "Browser handles mic access across visits.",
        lacks: "No explicit no-re-prompt consent management.",
      },
      hireVue: {
        level: "partial",
        has: "Typical browser permission behavior.",
        lacks: "No candidate-focused consent persistence feature.",
      },
      googleWarmup: {
        level: "partial",
        has: "Browser may retain mic permission.",
        lacks: "No structured consent memory for interview prep.",
      },
    },
  },
  {
    feature: "Self-hosted GPU vision pipeline",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "FastAPI vision service runs on your GPU for frame analysis — deployable alongside the app.",
        lacks: "No major gap — vision is self-hosted.",
      },
      pramp: { level: "no", has: "No vision pipeline.", lacks: "No GPU behavior analysis stack." },
      interviewingIo: { level: "no", has: "Human video observation.", lacks: "No self-hosted vision service." },
      finalRoundAi: { level: "no", has: "Cloud AI only.", lacks: "No GPU vision you operate." },
      hireVue: { level: "no", has: "Proprietary cloud analytics.", lacks: "No open vision pipeline on your hardware." },
      googleWarmup: { level: "no", has: "No vision stack.", lacks: "No GPU pipeline." },
    },
  },
  {
    feature: "Local LLM question generation (Ollama)",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "Ollama generates interview questions and evaluations on your machine — no external LLM API required.",
        lacks: "No major gap — local LLM is the default AI path.",
      },
      pramp: { level: "no", has: "Human peers ask questions.", lacks: "No local LLM question generation." },
      interviewingIo: { level: "no", has: "Humans or fixed banks.", lacks: "No Ollama integration." },
      finalRoundAi: { level: "no", has: "Cloud LLM service.", lacks: "No self-hosted Ollama." },
      hireVue: { level: "no", has: "Vendor AI models.", lacks: "No local LLM option." },
      googleWarmup: { level: "no", has: "Google-hosted models.", lacks: "No Ollama or local LLM." },
    },
  },
  {
    feature: "Self-hosted speech-to-text (Whisper)",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "Whisper (small) transcribes answers on your AI service — audio stays on your stack.",
        lacks: "No major gap — Whisper is self-hosted.",
      },
      pramp: { level: "no", has: "Live conversation; no STT archive.", lacks: "No self-hosted Whisper pipeline." },
      interviewingIo: { level: "no", has: "Human hears answers directly.", lacks: "No Whisper transcription layer." },
      finalRoundAi: {
        level: "partial",
        has: "Cloud speech-to-text for AI mocks.",
        lacks: "Not Whisper on hardware you control.",
      },
      hireVue: {
        level: "partial",
        has: "Vendor STT for async video responses.",
        lacks: "No open self-hosted Whisper path for candidates.",
      },
      googleWarmup: { level: "no", has: "Browser speech input.", lacks: "No Whisper archive or scoring pipeline." },
    },
  },
  {
    feature: "Per-question explain pages with visual breakdown",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "Dedicated /result/.../question/[sequence] pages with model answer, rubric, and visual breakdown.",
        lacks: "No major gap — explain pages ship with results.",
      },
      pramp: { level: "no", has: "Verbal debrief only.", lacks: "No per-question visual explain routes." },
      interviewingIo: {
        level: "partial",
        has: "Written notes from interviewer.",
        lacks: "No visual per-question breakdown pages in-app.",
      },
      finalRoundAi: {
        level: "partial",
        has: "AI feedback per question in session review.",
        lacks: "No rich visual explain page per sequence.",
      },
      hireVue: { level: "no", has: "Employer review dashboards.", lacks: "No candidate explain pages with visuals." },
      googleWarmup: {
        level: "partial",
        has: "Short tips after each practice answer.",
        lacks: "No full visual breakdown pages per question.",
      },
    },
  },
  {
    feature: "PDF report with behavior summary",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "PDF export includes scores, category breakdown, and behavior summary from vision/audio analysis.",
        lacks: "No major gap — behavior is in the PDF.",
      },
      pramp: { level: "no", has: "No PDF export.", lacks: "No behavior summary document." },
      interviewingIo: { level: "no", has: "Email or dashboard notes.", lacks: "No PDF with behavior analytics." },
      finalRoundAi: {
        level: "partial",
        has: "Downloadable or shareable feedback in some flows.",
        lacks: "No vision/audio behavior section in PDF.",
      },
      hireVue: {
        level: "partial",
        has: "Employer PDF/score packs.",
        lacks: "No candidate-owned behavior PDF for practice.",
      },
      googleWarmup: { level: "no", has: "No formal reports.", lacks: "No PDF behavior summary." },
    },
  },
  {
    feature: "No vendor lock-in (own your data)",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "MySQL database, local media, and open stack — export reports and host on your VPS.",
        lacks: "No major gap — you own the deployment and data.",
      },
      pramp: { level: "no", has: "Data lives in Pramp SaaS.", lacks: "Cannot fully own or self-host your history." },
      interviewingIo: { level: "no", has: "Platform-held session records.", lacks: "No data sovereignty or self-host." },
      finalRoundAi: { level: "no", has: "Cloud account-bound history.", lacks: "No open data export to your infra." },
      hireVue: { level: "no", has: "Employer-owned assessment data.", lacks: "Candidates cannot own the full stack." },
      googleWarmup: { level: "no", has: "Google account practice history.", lacks: "No self-hosted data ownership." },
    },
  },
];
