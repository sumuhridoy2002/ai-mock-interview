export type ComponentKind = "client" | "server" | "hybrid";

export interface SystemComponent {
  id: string;
  name: string;
  kind: ComponentKind;
  technology: string;
  category: string;
  role: string;
  stack: string;
  endpoint: string;
  port?: string;
}

export const SYSTEM_COMPONENTS: SystemComponent[] = [
  {
    id: "nextjs",
    name: "Next.js Frontend",
    kind: "client",
    technology: "Next.js 16",
    category: "Browser UI",
    role: "UI, routing, live interview room",
    stack: "Next.js 16 · React 19 · TypeScript",
    endpoint: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
    port: "3000",
  },
  {
    id: "laravel",
    name: "Laravel API",
    kind: "server",
    technology: "Laravel 13 / PHP",
    category: "REST API",
    role: "REST API, auth, queues, persistence",
    stack: "Laravel 13 · Sanctum · PHP",
    endpoint: process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:8000",
    port: "8000",
  },
  {
    id: "ai-service",
    name: "Python AI Service",
    kind: "server",
    technology: "FastAPI",
    category: "AI Gateway",
    role: "Questions, scoring, Whisper STT, reports",
    stack: "FastAPI · Ollama · Whisper",
    endpoint: "http://127.0.0.1:8001",
    port: "8001",
  },
  {
    id: "reverb",
    name: "Laravel Reverb",
    kind: "server",
    technology: "Reverb / WebSocket",
    category: "Realtime",
    role: "Real-time interview events",
    stack: "WebSocket · Pusher protocol",
    endpoint: `${process.env.NEXT_PUBLIC_REVERB_SCHEME || "http"}://${process.env.NEXT_PUBLIC_REVERB_HOST || "localhost"}:${process.env.NEXT_PUBLIC_REVERB_PORT || "8080"}`,
    port: process.env.NEXT_PUBLIC_REVERB_PORT || "8080",
  },
  {
    id: "queue",
    name: "Queue Worker",
    kind: "server",
    technology: "Laravel Queue",
    category: "Background jobs",
    role: "Evaluate answers, generate questions, send emails",
    stack: "Laravel Queue · Redis/Database",
    endpoint: "Background process",
  },
  {
    id: "ollama",
    name: "Ollama LLM",
    kind: "server",
    technology: "Ollama (Llama 3)",
    category: "AI inference",
    role: "AI question & evaluation generation",
    stack: "Llama 3 · local inference",
    endpoint: "http://127.0.0.1:11434",
    port: "11434",
  },
  {
    id: "whisper",
    name: "Whisper STT",
    kind: "server",
    technology: "Whisper small",
    category: "Speech-to-text",
    role: "Server-side speech-to-text",
    stack: "OpenAI Whisper · ffmpeg",
    endpoint: "ai-service /pipeline/transcribe",
  },
  {
    id: "database",
    name: "Database",
    kind: "server",
    technology: "MySQL / SQLite",
    category: "Persistence",
    role: "Users, interviews, scores, resumes",
    stack: "MySQL / SQLite",
    endpoint: "Laravel persistence layer",
  },
  {
    id: "media-recorder",
    name: "MediaRecorder",
    kind: "client",
    technology: "Browser MediaRecorder",
    category: "Browser capture",
    role: "Audio & video capture",
    stack: "Browser Web APIs",
    endpoint: "Client device",
  },
  {
    id: "speech-preview",
    name: "Speech Recognition",
    kind: "client",
    technology: "Web Speech API",
    category: "Browser preview",
    role: "Live caption preview only",
    stack: "Web Speech API",
    endpoint: "Client browser",
  },
];
