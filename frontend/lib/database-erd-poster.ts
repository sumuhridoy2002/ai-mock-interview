export interface PosterField {
  name: string;
  kind?: "PK" | "FK";
}

export interface PosterEntity {
  id: string;
  title: string;
  headerColor: string;
  x: number;
  y: number;
  width: number;
  fields: PosterField[];
}

export interface PosterRelation {
  from: string;
  to: string;
  fromSide: "top" | "bottom" | "left" | "right";
  toSide: "top" | "bottom" | "left" | "right";
  fromCard: "1" | "M";
  toCard: "1" | "M";
}

export const ERD_POSTER_TITLE = "MOCK INTERVIEW PRO — DB CLASS DIAGRAM";

export const ERD_POSTER_VIEWBOX = { width: 1280, height: 820 };

export const ERD_POSTER_ENTITIES: PosterEntity[] = [
  {
    id: "users",
    title: "USERS",
    headerColor: "#5bbfb5",
    x: 64,
    y: 108,
    width: 208,
    fields: [
      { name: "id", kind: "PK" },
      { name: "name" },
      { name: "email" },
      { name: "password" },
      { name: "role" },
    ],
  },
  {
    id: "resumes",
    title: "RESUMES",
    headerColor: "#7cb87a",
    x: 64,
    y: 368,
    width: 208,
    fields: [
      { name: "id", kind: "PK" },
      { name: "user_id", kind: "FK" },
      { name: "original_filename" },
      { name: "parsed_profile" },
      { name: "status" },
    ],
  },
  {
    id: "interviews",
    title: "INTERVIEWS",
    headerColor: "#e8c547",
    x: 368,
    y: 108,
    width: 228,
    fields: [
      { name: "id", kind: "PK" },
      { name: "user_id", kind: "FK" },
      { name: "resume_id", kind: "FK" },
      { name: "job_title" },
      { name: "interview_type" },
      { name: "status" },
      { name: "scheduled_at" },
    ],
  },
  {
    id: "interview_questions",
    title: "INTERVIEW_QUESTIONS",
    headerColor: "#e8a04a",
    x: 368,
    y: 388,
    width: 228,
    fields: [
      { name: "id", kind: "PK" },
      { name: "interview_id", kind: "FK" },
      { name: "sequence" },
      { name: "question_text" },
      { name: "category" },
    ],
  },
  {
    id: "interview_answers",
    title: "INTERVIEW_ANSWERS",
    headerColor: "#e07a7a",
    x: 688,
    y: 388,
    width: 240,
    fields: [
      { name: "id", kind: "PK" },
      { name: "interview_question_id", kind: "FK" },
      { name: "transcript" },
      { name: "audio_path" },
      { name: "duration_seconds" },
    ],
  },
  {
    id: "interview_reports",
    title: "INTERVIEW_REPORTS",
    headerColor: "#9b7bd4",
    x: 688,
    y: 108,
    width: 240,
    fields: [
      { name: "id", kind: "PK" },
      { name: "interview_id", kind: "FK" },
      { name: "overall_score" },
      { name: "hiring_recommendation" },
      { name: "behavior_summary" },
      { name: "pdf_path" },
    ],
  },
  {
    id: "interview_scores",
    title: "INTERVIEW_SCORES",
    headerColor: "#6ea8d9",
    x: 992,
    y: 388,
    width: 220,
    fields: [
      { name: "id", kind: "PK" },
      { name: "interview_answer_id", kind: "FK" },
      { name: "overall_score" },
      { name: "relevance" },
      { name: "communication" },
    ],
  },
  {
    id: "answer_behaviors",
    title: "ANSWER_BEHAVIORS",
    headerColor: "#c47cae",
    x: 992,
    y: 608,
    width: 220,
    fields: [
      { name: "id", kind: "PK" },
      { name: "interview_answer_id", kind: "FK" },
      { name: "confidence" },
      { name: "eye_contact_ratio" },
      { name: "emotion_distribution" },
    ],
  },
];

export const ERD_POSTER_RELATIONS: PosterRelation[] = [
  { from: "users", to: "resumes", fromSide: "bottom", toSide: "top", fromCard: "1", toCard: "M" },
  { from: "users", to: "interviews", fromSide: "right", toSide: "left", fromCard: "1", toCard: "M" },
  { from: "resumes", to: "interviews", fromSide: "right", toSide: "bottom", fromCard: "1", toCard: "M" },
  { from: "interviews", to: "interview_questions", fromSide: "bottom", toSide: "top", fromCard: "1", toCard: "M" },
  { from: "interviews", to: "interview_reports", fromSide: "right", toSide: "left", fromCard: "1", toCard: "1" },
  { from: "interview_questions", to: "interview_answers", fromSide: "right", toSide: "left", fromCard: "1", toCard: "M" },
  { from: "interview_answers", to: "interview_scores", fromSide: "right", toSide: "left", fromCard: "1", toCard: "1" },
  { from: "interview_answers", to: "answer_behaviors", fromSide: "bottom", toSide: "top", fromCard: "1", toCard: "1" },
];

export const ERD_POSTER_ROW_HEIGHT = 30;
export const ERD_POSTER_HEADER_HEIGHT = 38;

export function posterEntityHeight(entity: PosterEntity): number {
  return ERD_POSTER_HEADER_HEIGHT + entity.fields.length * ERD_POSTER_ROW_HEIGHT + 10;
}

export function getPosterEntity(id: string): PosterEntity | undefined {
  return ERD_POSTER_ENTITIES.find((entity) => entity.id === id);
}
