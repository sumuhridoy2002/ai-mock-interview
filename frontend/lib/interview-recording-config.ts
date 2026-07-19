/**
 * Interview media capture settings (local dev defaults — no screen recording).
 * Snapshots from webcam + browser speech-to-text only; no MediaRecorder encoding.
 */
export const INTERVIEW_RECORDING = {
  /** Tab/screen share + full-session upload — disabled (heavy on CPU). */
  enableScreenRecording: false,
  enableFullSessionRecording: false,
  /** Per-answer video/audio MediaRecorder — disabled; snapshots + STT only. */
  enableAnswerMediaRecorder: false,
  /** JPEG snapshot interval while "Record Answer" is active (seconds). */
  snapshotIntervalSec: 10,
  /** Webcam preview resolution (lower = faster snapshot capture). */
  videoConstraints: {
    width: { ideal: 640, max: 1280 },
    height: { ideal: 480, max: 720 },
    facingMode: "user" as const,
  },
} as const;
