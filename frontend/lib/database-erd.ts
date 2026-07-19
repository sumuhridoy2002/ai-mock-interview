export type ColumnKind = "pk" | "fk" | "uk" | "col";

export interface ErdColumn {
  name: string;
  type: string;
  kind?: ColumnKind;
  note?: string;
}

export interface ErdRelation {
  from: string;
  to: string;
  label: string;
  cardinality: string;
}

export interface ErdTable {
  name: string;
  group: ErdGroupId;
  description: string;
  columns: ErdColumn[];
}

export type ErdGroupId =
  | "auth"
  | "interview"
  | "scoring"
  | "memory"
  | "platform"
  | "framework";

export interface ErdGroup {
  id: ErdGroupId;
  label: string;
  description: string;
  accent: "indigo" | "violet" | "emerald" | "amber" | "sky" | "slate";
}

export const ERD_GROUPS: ErdGroup[] = [
  {
    id: "auth",
    label: "Auth & Users",
    description: "Accounts, roles, public profiles, and API tokens.",
    accent: "indigo",
  },
  {
    id: "interview",
    label: "Interview Pipeline",
    description: "Resumes, interviews, sessions, questions, and answers.",
    accent: "violet",
  },
  {
    id: "scoring",
    label: "Scoring & Reports",
    description: "Per-answer scores, vision behavior, and final reports.",
    accent: "emerald",
  },
  {
    id: "memory",
    label: "AI Memory",
    description: "Session agent memory, user mastery, and expert chat.",
    accent: "amber",
  },
  {
    id: "platform",
    label: "Sharing",
    description: "Public share links for candidate dossiers.",
    accent: "sky",
  },
  {
    id: "framework",
    label: "Laravel Framework",
    description: "Queue, cache, sessions, and Sanctum token storage.",
    accent: "slate",
  },
];

export const ERD_TABLES: ErdTable[] = [
  {
    name: "users",
    group: "auth",
    description: "Platform accounts (admin or candidate) with optional public profile fields.",
    columns: [
      { name: "id", type: "bigint", kind: "pk" },
      { name: "name", type: "varchar" },
      { name: "email", type: "varchar", kind: "uk" },
      { name: "role", type: "enum(admin,candidate)" },
      { name: "public_slug", type: "varchar", kind: "uk" },
      { name: "is_profile_public", type: "boolean" },
      { name: "show_on_leaderboard", type: "boolean" },
      { name: "public_headline", type: "varchar" },
      { name: "password", type: "varchar" },
      { name: "email_verified_at", type: "timestamp" },
    ],
  },
  {
    name: "personal_access_tokens",
    group: "auth",
    description: "Sanctum API tokens (polymorphic tokenable → users).",
    columns: [
      { name: "id", type: "bigint", kind: "pk" },
      { name: "tokenable_type", type: "varchar", note: "morph" },
      { name: "tokenable_id", type: "bigint", note: "→ users.id" },
      { name: "token", type: "varchar", kind: "uk" },
      { name: "abilities", type: "text" },
      { name: "expires_at", type: "timestamp" },
    ],
  },
  {
    name: "password_reset_tokens",
    group: "auth",
    description: "Password reset tokens keyed by email.",
    columns: [
      { name: "email", type: "varchar", kind: "pk" },
      { name: "token", type: "varchar" },
      { name: "created_at", type: "timestamp" },
    ],
  },
  {
    name: "sessions",
    group: "auth",
    description: "Web session store (user_id indexed, no FK constraint).",
    columns: [
      { name: "id", type: "varchar", kind: "pk" },
      { name: "user_id", type: "bigint", note: "→ users.id" },
      { name: "ip_address", type: "varchar" },
      { name: "payload", type: "longtext" },
      { name: "last_activity", type: "int" },
    ],
  },
  {
    name: "resumes",
    group: "interview",
    description: "Uploaded CV files parsed into structured profiles.",
    columns: [
      { name: "id", type: "bigint", kind: "pk" },
      { name: "user_id", type: "bigint", kind: "fk", note: "→ users.id CASCADE" },
      { name: "original_filename", type: "varchar" },
      { name: "storage_path", type: "varchar" },
      { name: "file_hash", type: "varchar", kind: "uk", note: "per user" },
      { name: "parsed_profile", type: "json" },
      { name: "status", type: "enum" },
    ],
  },
  {
    name: "interviews",
    group: "interview",
    description: "Mock interview instances tied to a resume and job description.",
    columns: [
      { name: "id", type: "bigint", kind: "pk" },
      { name: "user_id", type: "bigint", kind: "fk", note: "→ users.id CASCADE" },
      { name: "resume_id", type: "bigint", kind: "fk", note: "→ resumes.id CASCADE" },
      { name: "job_title", type: "varchar" },
      { name: "job_description", type: "text" },
      { name: "job_analysis", type: "json" },
      { name: "experience_level", type: "enum" },
      { name: "interview_type", type: "enum" },
      { name: "status", type: "enum" },
      { name: "scheduled_at", type: "timestamp" },
      { name: "full_video_path", type: "varchar" },
    ],
  },
  {
    name: "interview_sessions",
    group: "interview",
    description: "Live session state (1:1 with interview).",
    columns: [
      { name: "id", type: "bigint", kind: "pk" },
      { name: "interview_id", type: "bigint", kind: "fk", note: "→ interviews.id CASCADE" },
      { name: "session_uuid", type: "uuid", kind: "uk" },
      { name: "phase", type: "enum" },
      { name: "current_question_index", type: "int" },
      { name: "context_snapshot", type: "json" },
      { name: "started_at", type: "timestamp" },
      { name: "ended_at", type: "timestamp" },
    ],
  },
  {
    name: "interview_questions",
    group: "interview",
    description: "Generated or follow-up questions for an interview.",
    columns: [
      { name: "id", type: "bigint", kind: "pk" },
      { name: "interview_id", type: "bigint", kind: "fk", note: "→ interviews.id CASCADE" },
      { name: "sequence", type: "int" },
      { name: "category", type: "enum" },
      { name: "question_text", type: "text" },
      { name: "parent_question_id", type: "bigint", kind: "fk", note: "→ self SET NULL" },
      { name: "source", type: "enum" },
      { name: "metadata", type: "json" },
    ],
  },
  {
    name: "interview_answers",
    group: "interview",
    description: "Candidate responses with transcript, audio, and video paths.",
    columns: [
      { name: "id", type: "bigint", kind: "pk" },
      { name: "interview_question_id", type: "bigint", kind: "fk", note: "→ interview_questions.id CASCADE" },
      { name: "transcript", type: "text" },
      { name: "audio_path", type: "varchar" },
      { name: "video_path", type: "varchar" },
      { name: "duration_seconds", type: "int" },
      { name: "idempotency_key", type: "varchar", kind: "uk" },
    ],
  },
  {
    name: "interview_scores",
    group: "scoring",
    description: "AI rubric scores per answer (1:1 with answer).",
    columns: [
      { name: "id", type: "bigint", kind: "pk" },
      { name: "interview_answer_id", type: "bigint", kind: "fk", note: "→ interview_answers.id CASCADE" },
      { name: "relevance", type: "tinyint" },
      { name: "technical_accuracy", type: "tinyint" },
      { name: "communication", type: "tinyint" },
      { name: "confidence", type: "tinyint" },
      { name: "completeness", type: "tinyint" },
      { name: "overall_score", type: "tinyint" },
      { name: "strengths", type: "json" },
      { name: "weaknesses", type: "json" },
      { name: "raw_ai_response", type: "json" },
    ],
  },
  {
    name: "answer_behaviors",
    group: "scoring",
    description: "Vision-derived behavior metrics per answer (1:1).",
    columns: [
      { name: "id", type: "bigint", kind: "pk" },
      { name: "interview_answer_id", type: "bigint", kind: "fk", note: "→ interview_answers.id CASCADE" },
      { name: "confidence", type: "tinyint" },
      { name: "nervousness", type: "tinyint" },
      { name: "eye_contact_ratio", type: "float" },
      { name: "head_stability", type: "float" },
      { name: "emotion_distribution", type: "json" },
      { name: "prosody", type: "json" },
      { name: "coaching_narrative", type: "text" },
    ],
  },
  {
    name: "interview_reports",
    group: "scoring",
    description: "Final hiring recommendation and PDF report (1:1 with interview).",
    columns: [
      { name: "id", type: "bigint", kind: "pk" },
      { name: "interview_id", type: "bigint", kind: "fk", note: "→ interviews.id CASCADE" },
      { name: "overall_score", type: "tinyint" },
      { name: "category_scores", type: "json" },
      { name: "hiring_recommendation", type: "enum" },
      { name: "behavior_summary", type: "json" },
      { name: "report_json", type: "json" },
      { name: "pdf_path", type: "varchar" },
    ],
  },
  {
    name: "agent_memories",
    group: "memory",
    description: "Rolling AI context for an interview session.",
    columns: [
      { name: "id", type: "bigint", kind: "pk" },
      { name: "interview_session_id", type: "bigint", kind: "fk", note: "→ interview_sessions.id CASCADE" },
      { name: "questions_asked", type: "json" },
      { name: "answers_summary", type: "json" },
      { name: "candidate_strengths", type: "json" },
      { name: "candidate_weaknesses", type: "json" },
      { name: "topics_covered", type: "json" },
      { name: "token_budget_used", type: "int" },
    ],
  },
  {
    name: "user_memory_profiles",
    group: "memory",
    description: "Long-term learner profile (1:1 with user).",
    columns: [
      { name: "id", type: "bigint", kind: "pk" },
      { name: "user_id", type: "bigint", kind: "fk", note: "→ users.id CASCADE" },
      { name: "mastered_topics", type: "json" },
      { name: "strengths", type: "json" },
      { name: "weaknesses", type: "json" },
      { name: "summary", type: "text" },
      { name: "interviews_completed", type: "int" },
    ],
  },
  {
    name: "user_question_mastery",
    group: "memory",
    description: "Per-question mastery tracking across interviews.",
    columns: [
      { name: "id", type: "bigint", kind: "pk" },
      { name: "user_id", type: "bigint", kind: "fk", note: "→ users.id CASCADE" },
      { name: "normalized_question", type: "text" },
      { name: "topic", type: "varchar" },
      { name: "category", type: "varchar" },
      { name: "best_overall_score", type: "tinyint" },
      { name: "mastered", type: "boolean" },
      { name: "source_interview_id", type: "bigint", kind: "fk", note: "→ interviews.id SET NULL" },
    ],
  },
  {
    name: "expert_chat_messages",
    group: "memory",
    description: "AI Expert coach conversation history.",
    columns: [
      { name: "id", type: "bigint", kind: "pk" },
      { name: "user_id", type: "bigint", kind: "fk", note: "→ users.id CASCADE" },
      { name: "session_id", type: "uuid" },
      { name: "role", type: "enum(user,assistant)" },
      { name: "content", type: "text" },
    ],
  },
  {
    name: "public_share_links",
    group: "platform",
    description: "Tokenized public dossier links created by admins.",
    columns: [
      { name: "id", type: "bigint", kind: "pk" },
      { name: "user_id", type: "bigint", kind: "fk", note: "→ users.id CASCADE" },
      { name: "token", type: "varchar", kind: "uk" },
      { name: "label", type: "varchar" },
      { name: "includes_cv", type: "boolean" },
      { name: "includes_reports", type: "boolean" },
      { name: "includes_scores", type: "boolean" },
      { name: "created_by", type: "bigint", kind: "fk", note: "→ users.id SET NULL" },
      { name: "expires_at", type: "timestamp" },
      { name: "revoked_at", type: "timestamp" },
      { name: "view_count", type: "int" },
    ],
  },
  {
    name: "cache",
    group: "framework",
    description: "Laravel database cache store.",
    columns: [
      { name: "key", type: "varchar", kind: "pk" },
      { name: "value", type: "mediumtext" },
      { name: "expiration", type: "bigint" },
    ],
  },
  {
    name: "cache_locks",
    group: "framework",
    description: "Laravel atomic cache locks.",
    columns: [
      { name: "key", type: "varchar", kind: "pk" },
      { name: "owner", type: "varchar" },
      { name: "expiration", type: "bigint" },
    ],
  },
  {
    name: "jobs",
    group: "framework",
    description: "Queued background jobs (AI parsing, scoring, reports).",
    columns: [
      { name: "id", type: "bigint", kind: "pk" },
      { name: "queue", type: "varchar" },
      { name: "payload", type: "longtext" },
      { name: "attempts", type: "smallint" },
      { name: "available_at", type: "int" },
    ],
  },
  {
    name: "job_batches",
    group: "framework",
    description: "Laravel batch job tracking.",
    columns: [
      { name: "id", type: "varchar", kind: "pk" },
      { name: "name", type: "varchar" },
      { name: "total_jobs", type: "int" },
      { name: "pending_jobs", type: "int" },
      { name: "failed_jobs", type: "int" },
    ],
  },
  {
    name: "failed_jobs",
    group: "framework",
    description: "Dead-letter queue for failed jobs.",
    columns: [
      { name: "id", type: "bigint", kind: "pk" },
      { name: "uuid", type: "varchar", kind: "uk" },
      { name: "connection", type: "varchar" },
      { name: "queue", type: "varchar" },
      { name: "payload", type: "longtext" },
      { name: "exception", type: "longtext" },
    ],
  },
];

export const ERD_RELATIONS: ErdRelation[] = [
  { from: "users", to: "resumes", label: "owns", cardinality: "1 — *" },
  { from: "users", to: "interviews", label: "conducts", cardinality: "1 — *" },
  { from: "users", to: "user_memory_profiles", label: "has profile", cardinality: "1 — 1" },
  { from: "users", to: "user_question_mastery", label: "tracks mastery", cardinality: "1 — *" },
  { from: "users", to: "public_share_links", label: "shared as", cardinality: "1 — *" },
  { from: "users", to: "expert_chat_messages", label: "chats", cardinality: "1 — *" },
  { from: "users", to: "personal_access_tokens", label: "tokenable", cardinality: "1 — *" },
  { from: "users", to: "sessions", label: "logged in", cardinality: "1 — *" },
  { from: "resumes", to: "interviews", label: "used in", cardinality: "1 — *" },
  { from: "interviews", to: "interview_sessions", label: "runs as", cardinality: "1 — 1" },
  { from: "interviews", to: "interview_questions", label: "contains", cardinality: "1 — *" },
  { from: "interviews", to: "interview_reports", label: "summarized in", cardinality: "1 — 1" },
  { from: "interviews", to: "user_question_mastery", label: "source", cardinality: "1 — *" },
  { from: "interview_questions", to: "interview_questions", label: "follow-up", cardinality: "* — 1" },
  { from: "interview_questions", to: "interview_answers", label: "answered by", cardinality: "1 — *" },
  { from: "interview_answers", to: "interview_scores", label: "scored as", cardinality: "1 — 1" },
  { from: "interview_answers", to: "answer_behaviors", label: "behavior", cardinality: "1 — 1" },
  { from: "interview_sessions", to: "agent_memories", label: "stores", cardinality: "1 — *" },
];

export function getTablesByGroup(groupId: ErdGroupId | "all"): ErdTable[] {
  if (groupId === "all") return ERD_TABLES;
  return ERD_TABLES.filter((table) => table.group === groupId);
}

export function getRelationsForTables(tableNames: Set<string>): ErdRelation[] {
  return ERD_RELATIONS.filter((relation) => tableNames.has(relation.from) && tableNames.has(relation.to));
}

export function filterTables(query: string, groupId: ErdGroupId | "all"): ErdTable[] {
  const base = getTablesByGroup(groupId);
  const term = query.trim().toLowerCase();
  if (!term) return base;

  return base.filter(
    (table) =>
      table.name.includes(term) ||
      table.description.toLowerCase().includes(term) ||
      table.columns.some(
        (column) =>
          column.name.includes(term) ||
          column.type.includes(term) ||
          column.note?.toLowerCase().includes(term),
      ),
  );
}
