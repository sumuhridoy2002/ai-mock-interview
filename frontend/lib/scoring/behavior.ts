import SCORING_CONSTANTS from "./constants";

export function toPercent(ratio: number): number {
  return Math.round(ratio * 100);
}

export function clampBar(value: number, max = 100): number {
  return Math.min(max, Math.max(0, value));
}

export function sortEmotions(dist: Record<string, number>): [string, number][] {
  return Object.entries(dist).sort((a, b) => b[1] - a[1]);
}

export interface FrameScore {
  face_detected?: boolean;
  confidence?: number;
  nervousness?: number;
  dominant_emotion?: string;
  eye_contact?: number;
  frame_status?: "ok" | "issue";
}

const FRAME_OK_CONFIDENCE = 60;
const FRAME_OK_NERVOUSNESS = 45;
const FRAME_OK_EYE_CONTACT = 0.5;

export function deriveFrameStatus(frame?: FrameScore): "ok" | "issue" {
  if (!frame) return "issue";
  if (frame.frame_status) return frame.frame_status;
  if (!frame.face_detected) return "issue";
  const confidence = frame.confidence ?? 0;
  const nervousness = frame.nervousness ?? 100;
  const eyeContact = frame.eye_contact ?? 0;
  if (confidence >= FRAME_OK_CONFIDENCE && nervousness <= FRAME_OK_NERVOUSNESS && eyeContact >= FRAME_OK_EYE_CONTACT) {
    return "ok";
  }
  return "issue";
}

export function frameBorderClass(frame?: FrameScore): string {
  return deriveFrameStatus(frame) === "ok"
    ? "border-emerald-500 hover:border-emerald-400"
    : "border-red-500 hover:border-red-400";
}
