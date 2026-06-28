"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const CONSENT_KEY = "mi_media_consent";

/** Check both camera and microphone permission state via the Permissions API */
async function checkMediaPermissionsGranted(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.permissions) return false;
  try {
    const [cam, mic] = await Promise.all([
      navigator.permissions.query({ name: "camera" as PermissionName }),
      navigator.permissions.query({ name: "microphone" as PermissionName }),
    ]);
    return cam.state === "granted" && mic.state === "granted";
  } catch {
    // Some browsers don't support querying camera/microphone permissions
    return false;
  }
}

export function useMediaStream() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoStarted, setAutoStarted] = useState(false);

  const start = useCallback(async () => {
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      setStream(media);
      setError(null);
      // Persist consent so future visits skip the permission gate
      try { localStorage.setItem(CONSENT_KEY, "1"); } catch { /* ignore */ }
      return media;
    } catch {
      setError("Camera and microphone access is required for the interview.");
      return null;
    }
  }, []);

  const stop = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  }, [stream]);

  // On mount: if permissions were previously granted (Permissions API or localStorage
  // flag), silently acquire the stream so the user doesn't see the gate again.
  useEffect(() => {
    let cancelled = false;
    async function tryAutoStart() {
      const storedConsent = (() => {
        try { return localStorage.getItem(CONSENT_KEY) === "1"; } catch { return false; }
      })();

      const alreadyGranted = storedConsent || (await checkMediaPermissionsGranted());
      if (!alreadyGranted || cancelled) return;

      const media = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      }).catch(() => null);

      if (!cancelled && media) {
        setStream(media);
        setAutoStarted(true);
      }
    }
    void tryAutoStart();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => stream?.getTracks().forEach((t) => t.stop()), [stream]);

  return { stream, error, start, stop, autoStarted };
}

function getSupportedVideoMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;

  const candidates = [
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp9,opus",
    "video/webm",
  ];

  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

function getSupportedAudioMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;

  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
  ];

  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

function extensionForMime(mimeType: string): string {
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("ogg")) return "ogg";
  return "webm";
}

interface RecorderSession {
  recorder: MediaRecorder;
  chunks: Blob[];
  mimeType: string;
  kind: "video" | "audio";
}

function createRecorderSession(
  stream: MediaStream,
  kind: "video" | "audio"
): RecorderSession | null {
  const mimeType =
    kind === "video"
      ? getSupportedVideoMimeType() ?? "video/webm"
      : getSupportedAudioMimeType() ?? "audio/webm";

  if (typeof MediaRecorder === "undefined") return null;

  const options: MediaRecorderOptions = {};
  if (MediaRecorder.isTypeSupported(mimeType)) {
    options.mimeType = mimeType;
  }

  try {
    const recorder = new MediaRecorder(stream, options);
    const chunks: Blob[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    return {
      recorder,
      chunks,
      mimeType: recorder.mimeType || mimeType,
      kind,
    };
  } catch {
    return null;
  }
}

function stopRecorderSession(session: RecorderSession): Promise<Blob | null> {
  return new Promise((resolve) => {
    const { recorder, chunks, mimeType } = session;

    if (recorder.state === "inactive") {
      resolve(
        chunks.length
          ? new Blob(chunks, { type: mimeType })
          : null
      );
      return;
    }

    recorder.onstop = () => {
      resolve(
        chunks.length
          ? new Blob(chunks, { type: mimeType })
          : null
      );
    };

    if (recorder.state === "recording") {
      recorder.requestData();
    }

    recorder.stop();
  });
}

export interface RecordedAnswer {
  videoBlob: Blob;
  audioBlob: Blob;
  videoFilename: string;
  audioFilename: string;
  durationSeconds: number;
  transcript: string;
}

interface SpeechRecognitionResultItem {
  readonly transcript?: string;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly 0: SpeechRecognitionResultItem | undefined;
}

interface BrowserSpeechRecognitionEvent {
  readonly results: ArrayLike<SpeechRecognitionResult>;
  readonly resultIndex: number;
}

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function getSpeechRecognitionCtor():
  | (new () => BrowserSpeechRecognition)
  | null {
  if (typeof window === "undefined") return null;

  const win = window as Window & {
    SpeechRecognition?: new () => BrowserSpeechRecognition;
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
  };

  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
}

function useBrowserTranscription() {
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const transcriptPartsRef = useRef<string[]>([]);
  const [liveTranscript, setLiveTranscript] = useState("");

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    transcriptPartsRef.current = [];
    setLiveTranscript("");
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const results = event.results;

      const finals: string[] = [...transcriptPartsRef.current];
      let interim = "";

      for (let i = 0; i < results.length; i += 1) {
        const piece = results[i]?.[0]?.transcript?.trim();
        if (!piece) continue;
        if (results[i].isFinal) {
          if (!finals.includes(piece)) {
            finals.push(piece);
          }
        } else if (i >= event.resultIndex) {
          interim = [interim, piece].filter(Boolean).join(" ");
        }
      }

      transcriptPartsRef.current = finals;
      setLiveTranscript([finals.join(" "), interim].filter(Boolean).join(" ").trim());
    };

    recognition.onerror = () => {
      // Browser STT is best-effort; server Whisper is the primary path.
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      recognitionRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      return transcriptPartsRef.current.join(" ").trim();
    }

    recognition.stop();
    recognitionRef.current = null;

    return transcriptPartsRef.current.join(" ").trim();
  }, []);

  const abort = useCallback(() => {
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    transcriptPartsRef.current = [];
    setLiveTranscript("");
  }, []);

  return { start, stop, abort, liveTranscript };
}

export function useMediaRecorder(
  stream: MediaStream | null,
  onAnswerReady: (data: RecordedAnswer) => void
) {
  const sessionsRef = useRef<RecorderSession[]>([]);
  const startedAtRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onAnswerReadyRef = useRef(onAnswerReady);
  const browserTranscription = useBrowserTranscription();
  const [recording, setRecording] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  onAnswerReadyRef.current = onAnswerReady;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!stream || recording) return;

    try {
      setError(null);
      sessionsRef.current = [];
      clearTimer();

      const videoStream = stream;
      const audioTracks = stream.getAudioTracks();
      const audioStream =
        audioTracks.length > 0
          ? new MediaStream(audioTracks.map((track) => track.clone()))
          : null;

      const videoSession = createRecorderSession(videoStream, "video");
      if (!videoSession) {
        throw new Error("Video recording is not supported in this browser.");
      }

      sessionsRef.current.push(videoSession);

      if (audioStream) {
        const audioSession = createRecorderSession(audioStream, "audio");
        if (audioSession) {
          sessionsRef.current.push(audioSession);
        }
      }

      for (const session of sessionsRef.current) {
        session.recorder.start();
      }

      browserTranscription.start();

      startedAtRef.current = Date.now();
      setDurationSeconds(0);
      setRecording(true);

      timerRef.current = setInterval(() => {
        setDurationSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 250);
    } catch (err) {
      sessionsRef.current = [];
      browserTranscription.abort();
      clearTimer();
      setRecording(false);
      setError(
        err instanceof Error
          ? err.message
          : "Could not start recording. Use Chrome or Edge with camera/mic access enabled."
      );
    }
  }, [stream, recording, clearTimer, browserTranscription]);

  /** Discard the current recording without submitting — lets the user re-record */
  const cancelRecording = useCallback(() => {
    if (!recording) return;

    setRecording(false);
    clearTimer();
    setDurationSeconds(0);
    setError(null);
    browserTranscription.abort();

    for (const session of sessionsRef.current) {
      try {
        if (session.recorder.state !== "inactive") {
          session.recorder.ondataavailable = null;
          session.recorder.onstop = null;
          session.recorder.stop();
        }
      } catch { /* ignore */ }
    }
    sessionsRef.current = [];
  }, [recording, clearTimer, browserTranscription]);

  const stopRecording = useCallback(async () => {
    const sessions = sessionsRef.current;
    if (!sessions.length || !recording) {
      return;
    }

    setRecording(false);
    clearTimer();

    const elapsedSeconds = Math.max(
      1,
      Math.round((Date.now() - startedAtRef.current) / 1000)
    );

    const blobs = await Promise.all(sessions.map((session) => stopRecorderSession(session)));
    const finalTranscript =
      browserTranscription.stop() || browserTranscription.liveTranscript.trim();
    sessionsRef.current = [];

    const videoIndex = sessions.findIndex((session) => session.kind === "video");
    const audioIndex = sessions.findIndex((session) => session.kind === "audio");

    const videoBlob = videoIndex >= 0 ? blobs[videoIndex] : null;
    const audioBlob = audioIndex >= 0 ? blobs[audioIndex] : null;

    if (!videoBlob?.size && !audioBlob?.size) {
      setError("No recording captured. Hold Record longer, then try again.");
      return;
    }

    if (elapsedSeconds < 3) {
      setError("Answer too short. Please record at least 3 seconds.");
      return;
    }

    const resolvedVideo = videoBlob ?? audioBlob!;
    const resolvedAudio = audioBlob ?? videoBlob!;
    const videoMime = sessions[videoIndex]?.mimeType ?? resolvedVideo.type;
    const audioMime = sessions[audioIndex]?.mimeType ?? resolvedAudio.type;

    onAnswerReadyRef.current({
      videoBlob: resolvedVideo,
      audioBlob: resolvedAudio,
      videoFilename: `answer.${extensionForMime(videoMime)}`,
      audioFilename: `audio.${extensionForMime(audioMime)}`,
      durationSeconds: elapsedSeconds,
      transcript: finalTranscript,
    });
  }, [recording, clearTimer, browserTranscription]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  return { recording, durationSeconds, liveTranscript: browserTranscription.liveTranscript, startRecording, stopRecording, cancelRecording, error };
}

// ---------------------------------------------------------------------------
// Full-session recorder — records the entire interview as one continuous video
// ---------------------------------------------------------------------------

export interface FullSessionRecorderControls {
  startSession: () => void;
  stopSession: () => Promise<Blob | null>;
}

export function useFullSessionRecorder(stream: MediaStream | null): FullSessionRecorderControls {
  const sessionRef = useRef<RecorderSession | null>(null);

  const startSession = useCallback(() => {
    if (!stream || sessionRef.current) return;
    const session = createRecorderSession(stream, "video");
    if (!session) return;
    sessionRef.current = session;
    session.recorder.start(1000); // collect data every second
  }, [stream]);

  const stopSession = useCallback(async (): Promise<Blob | null> => {
    const session = sessionRef.current;
    sessionRef.current = null;
    if (!session) return null;
    return stopRecorderSession(session);
  }, []);

  // Clean up if component unmounts mid-recording
  useEffect(() => {
    return () => {
      const session = sessionRef.current;
      if (session && session.recorder.state !== "inactive") {
        try { session.recorder.stop(); } catch { /* ignore */ }
      }
      sessionRef.current = null;
    };
  }, []);

  return { startSession, stopSession };
}

function captureFrame(video: HTMLVideoElement): Blob | null {
  if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
  const parts = dataUrl.split(",");
  if (parts.length < 2) return null;
  const binary = atob(parts[1]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: "image/jpeg" });
}

/**
 * Captures a JPEG snapshot from the live video stream every `intervalSeconds`
 * while `active` is true. Returns all collected snapshots when stopped.
 */
export function useSnapshotCapture(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  active: boolean,
  intervalSeconds: number = 10,
) {
  const snapshotsRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const blob = captureFrame(video);
    if (blob) snapshotsRef.current.push(blob);
  }, [videoRef]);

  useEffect(() => {
    if (active) {
      snapshotsRef.current = [];
      // Delay first capture slightly so video frames are ready
      const t = setTimeout(capture, 400);
      intervalRef.current = setInterval(capture, intervalSeconds * 1000);
      return () => {
        clearTimeout(t);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [active, capture, intervalSeconds]);

  const getAndClear = useCallback((): Blob[] => {
    // Final synchronous capture when recording stops
    capture();
    const snaps = [...snapshotsRef.current];
    snapshotsRef.current = [];
    return snaps;
  }, [capture]);

  return { getAndClear };
}

export function useSpeechSynthesis() {
  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }, []);

  return { speak };
}
