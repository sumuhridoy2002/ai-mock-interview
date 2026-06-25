export type WorkArea = "memory" | "media" | "vision" | "recording";

export interface RecentWorkItem {
  id: string;
  title: string;
  summary: string;
  shippedAt: string;
  area: WorkArea;
  tags: string[];
  relatedPaths: string[];
}

export const AREA_LABELS: Record<WorkArea, string> = {
  memory: "Memory",
  media: "Media",
  vision: "Vision",
  recording: "Recording",
};

export const AREA_BADGE_CLASS: Record<WorkArea, string> = {
  memory: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  media: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  vision: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  recording: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

export const RECENT_PLATFORM_WORK: RecentWorkItem[] = [
  {
    id: "cross-interview-mastery",
    title: "Cross-interview question mastery",
    summary:
      "Questions answered well (overall score >= 60) are remembered per user and never asked again in future interviews. Both the exact question text and its topic are de-duplicated.",
    shippedAt: "2026-06",
    area: "memory",
    tags: ["user_question_mastery", "threshold 60", "topic + text dedupe"],
    relatedPaths: [
      "backend/app/Services/Interview/MasteryService.php",
      "backend/app/Jobs/GenerateQuestionJob.php",
    ],
  },
  {
    id: "user-memory-profile",
    title: "User memory profile shared with the AI",
    summary:
      "A rolling per-user profile of mastered topics, strengths, and weaknesses is sent to the AI question generator on every new interview, so questions build on prior performance instead of repeating it.",
    shippedAt: "2026-06",
    area: "memory",
    tags: ["user_memory_profiles", "AI context", "prior strengths/weaknesses"],
    relatedPaths: [
      "backend/app/Services/Interview/InterviewService.php",
      "ai-service/app/agents/question_generator.py",
    ],
  },
  {
    id: "persistent-media-consent",
    title: "Persistent camera & mic consent",
    summary:
      "Camera and microphone permission is requested once. On return visits and reloads the app silently re-acquires the stream using the Permissions API plus a localStorage flag, so the permission gate is not shown every interview.",
    shippedAt: "2026-06",
    area: "media",
    tags: ["mi_media_consent", "Permissions API", "auto getUserMedia"],
    relatedPaths: ["frontend/hooks/useMediaRecorder.ts"],
  },
  {
    id: "full-session-recording",
    title: "Full interview video recording",
    summary:
      "A continuous recorder captures the entire interview as one video and uploads it when the interview ends. The file is stored against the interview for later review.",
    shippedAt: "2026-06",
    area: "recording",
    tags: ["full_video_path", "MediaRecorder", "POST /interviews/{id}/recording"],
    relatedPaths: [
      "frontend/hooks/useMediaRecorder.ts",
      "backend/app/Http/Controllers/Api/InterviewController.php",
    ],
  },
  {
    id: "vision-behavior-analysis",
    title: "Per-answer vision & behavior analysis",
    summary:
      "Each recorded answer is analyzed on a GPU vision pipeline: facial emotion, eye contact, head stability, blink rate, and audio prosody combine into confidence and nervousness scores with an AI coaching note.",
    shippedAt: "2026-06",
    area: "vision",
    tags: ["MediaPipe", "OpenCV", "transformers", "POST /pipeline/vision/analyze"],
    relatedPaths: [
      "ai-service/app/pipelines/vision.py",
      "backend/app/Jobs/AnalyzeBehaviorJob.php",
    ],
  },
  {
    id: "behavior-in-reports",
    title: "Behavior metrics in the results UI",
    summary:
      "The results page now shows per-question body-language panels and an interview-wide presence summary covering confidence, nervousness, eye contact, emotions, and coaching notes.",
    shippedAt: "2026-06",
    area: "vision",
    tags: ["BehaviorPanel", "AggregateBehaviorCard", "answer_behaviors"],
    relatedPaths: [
      "frontend/components/interview/behavior-card.tsx",
      "backend/app/Services/Interview/ReportService.php",
    ],
  },
];
