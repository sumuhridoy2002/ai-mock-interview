"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { Mic, MicOff, Square, Volume2, CheckCircle2, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/components/interview/question-card";
import { useInterviewSession } from "@/hooks/useInterviewSession";
import {
  useMediaStream,
  useMediaRecorder,
  useFullSessionRecorder,
  useSnapshotCapture,
  useSpeechSynthesis,
} from "@/hooks/useMediaRecorder";
import { api, API_URL } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { uuid } from "@/lib/utils";

export default function LiveInterviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;
  const videoRef = useRef<HTMLVideoElement>(null);
  const interviewId = parseInt(searchParams.get("interviewId") || "0", 10);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [mediaReady, setMediaReady] = useState(false);
  const [maxQuestions, setMaxQuestions] = useState(10);
  const lastQuestionIdRef = useRef<number | null>(null);

  // ── Media stream (with auto-start when consent was already granted) ──────
  const { stream, error: mediaError, start: startMedia, autoStarted } = useMediaStream();

  // When auto-start fires, mark media ready immediately
  useEffect(() => {
    if (autoStarted && stream) {
      setMediaReady(true);
    }
  }, [autoStarted, stream]);

  const { speak } = useSpeechSynthesis();

  const {
    question,
    loading,
    maxQuestions: sessionMax,
    interviewComplete,
    awaitingNextQuestion,
    markAwaitingNextQuestion,
  } = useInterviewSession(interviewId, sessionId, handleInterviewComplete);

  useEffect(() => {
    if (sessionMax) setMaxQuestions(sessionMax);
  }, [sessionMax]);

  useEffect(() => {
    if (question?.question && question.question_id !== lastQuestionIdRef.current) {
      lastQuestionIdRef.current = question.question_id;
      speak(question.question);
    }
  }, [question?.question_id, question?.question, speak]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, mediaReady]);

  // ── Full-session recorder ─────────────────────────────────────────────────
  const { startSession: startFullRecording, stopSession: stopFullRecording } =
    useFullSessionRecorder(stream);

  // ── Per-answer snapshot capture (every 15s, no cv2 needed) ──────────────
  const [isRecordingActive, setIsRecordingActive] = useState(false);
  const { getAndClear: getSnapshots } = useSnapshotCapture(videoRef, isRecordingActive, 10);

  // Start full-session recording as soon as media is ready
  useEffect(() => {
    if (mediaReady && stream) {
      startFullRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaReady]);

  // Upload the full-session video blob to the backend
  const uploadFullRecording = useCallback(
    async (blob: Blob) => {
      if (!blob.size || !interviewId) return;
      try {
        const form = new FormData();
        form.append("recording", blob, `session.webm`);
        await fetch(`${API_URL}/interviews/${interviewId}/recording`, {
          method: "POST",
          headers: { Authorization: `Bearer ${getToken()}`, Accept: "application/json" },
          body: form,
        });
      } catch {
        // Non-critical — silently fail
      }
    },
    [interviewId]
  );

  // ── Interview complete handler ────────────────────────────────────────────
  function handleInterviewComplete() {
    router.push(`/interview/result/${interviewId}`);
  }

  const submitAnswer = useCallback(
    async ({
      durationSeconds,
      transcript,
    }: {
      videoBlob: Blob;
      audioBlob: Blob;
      videoFilename: string;
      audioFilename: string;
      durationSeconds: number;
      transcript: string;
    }) => {
      if (!question || !interviewId) return;
      setSubmitting(true);
      setSubmitError(null);
      const form = new FormData();
      form.append("question_id", String(question.question_id));
      form.append("idempotency_key", uuid());
      form.append("duration_seconds", String(durationSeconds));
      // Transcript comes from real-time browser STT — no audio upload needed
      if (transcript.trim()) {
        form.append("transcript", transcript.trim());
      }

      try {
        const response = await fetch(`${API_URL}/interviews/${interviewId}/answers`, {
          method: "POST",
          headers: { Authorization: `Bearer ${getToken()}`, Accept: "application/json" },
          body: form,
        });

        if (!response.ok) {
          throw new Error("Failed to submit answer.");
        }

        const answerData = await response.json();
        const answerId = answerData?.answer_id as number | undefined;

        // Upload snapshots captured during this answer
        const snapshots = getSnapshots();
        if (answerId && snapshots.length > 0) {
          const snapForm = new FormData();
          snapshots.forEach((blob, i) =>
            snapForm.append("snapshots[]", blob, `snap_${i}.jpg`)
          );
          try {
            await fetch(
              `${API_URL}/interviews/${interviewId}/answers/${answerId}/snapshots`,
              {
                method: "POST",
                headers: { Authorization: `Bearer ${getToken()}`, Accept: "application/json" },
                body: snapForm,
              }
            );
          } catch {
            // non-critical — gallery may be missing this answer's photos
          }
        }

        markAwaitingNextQuestion();
      } catch {
        setSubmitError("Could not submit your answer. Please try recording again.");
      } finally {
        setSubmitting(false);
      }
    },
    [question, interviewId, markAwaitingNextQuestion, getSnapshots]
  );

  const {
    recording,
    durationSeconds,
    liveTranscript,
    startRecording,
    stopRecording,
    cancelRecording,
    error: recorderError,
  } = useMediaRecorder(stream, submitAnswer);

  // Keep snapshot capture in sync with recording state
  useEffect(() => {
    setIsRecordingActive(recording);
  }, [recording]);

  async function handleEnableMedia() {
    const media = await startMedia();
    if (media) setMediaReady(true);
  }

  async function handleComplete() {
    if (recording) {
      await stopRecording();
    }
    // Stop full-session recording and upload
    const fullBlob = await stopFullRecording();
    if (fullBlob) {
      void uploadFullRecording(fullBlob);
    }
    await api(`/interviews/${interviewId}/complete`, { method: "POST" });
    router.push(`/interview/result/${interviewId}`);
  }

  if (interviewComplete) {
    return (
      <AppShell>
        <Card>
          <CardContent className="py-12 text-center text-slate-400">
            Interview complete. Preparing your full score summary...
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Camera & Microphone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!mediaReady ? (
              <div className="aspect-video rounded-lg bg-slate-900 flex flex-col items-center justify-center gap-4">
                <p className="text-slate-400 text-sm">Grant access to start the interview</p>
                <Button onClick={handleEnableMedia}>Enable Camera & Mic</Button>
                {mediaError && <p className="text-red-400 text-sm">{mediaError}</p>}
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full aspect-video rounded-lg bg-black object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
            )}
            <div className="flex flex-col gap-2">
              {/* Primary action row */}
              <div className="flex gap-2">
                {!recording ? (
                  <Button
                    onClick={() => {
                      setSubmitError(null);
                      startRecording();
                    }}
                    disabled={!mediaReady || !question || submitting || awaitingNextQuestion}
                    className="gap-2 flex-1"
                  >
                    <Mic className="h-4 w-4" /> Record Answer
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => {
                        setSubmitError(null);
                        void stopRecording();
                      }}
                      variant="destructive"
                      className="gap-2 flex-1"
                    >
                      <MicOff className="h-4 w-4" /> Stop & Submit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        cancelRecording();
                        setSubmitError(null);
                      }}
                      className="gap-2 border-amber-500/50 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 hover:border-amber-400"
                      title="Discard this recording and start over"
                    >
                      <RotateCcw className="h-4 w-4" /> Clear & Redo
                    </Button>
                  </>
                )}
              </div>
              {/* Secondary action row */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => question && speak(question.question)} className="gap-2 flex-1">
                  <Volume2 className="h-4 w-4" /> Repeat Question
                </Button>
                <Button variant="outline" onClick={handleComplete} className="gap-2 flex-1">
                  <Square className="h-4 w-4" /> End Interview
                </Button>
              </div>
            </div>
            {recording && (
              <p className="text-sm text-red-400 font-mono">
                Recording {Math.floor(durationSeconds / 60).toString().padStart(2, "0")}:
                {(durationSeconds % 60).toString().padStart(2, "0")}
              </p>
            )}
            {recording && (
              <p className="text-sm text-slate-400">
                {liveTranscript
                  ? <>Heard: <span className="text-slate-200">{liveTranscript}</span></>
                  : "Listening... speak clearly toward your microphone."}
              </p>
            )}
            {submitting && <p className="text-sm text-amber-400">Saving your answer...</p>}
            {awaitingNextQuestion && !submitting && (
              <p className="text-sm text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Answer saved — loading next question...
              </p>
            )}
            {submitError && <p className="text-sm text-red-400">{submitError}</p>}
            {recorderError && <p className="text-sm text-red-400">{recorderError}</p>}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {loading ? (
            <Card><CardContent className="py-12 text-center text-slate-400">Loading question...</CardContent></Card>
          ) : question ? (
            <QuestionCard
              question={question.question}
              category={question.category}
              sequence={question.sequence}
              maxQuestions={maxQuestions}
            />
          ) : awaitingNextQuestion ? (
            <Card><CardContent className="py-12 text-center text-slate-400">Preparing your next question...</CardContent></Card>
          ) : (
            <Card><CardContent className="py-12 text-center text-slate-400">Waiting for question...</CardContent></Card>
          )}
          <Card className="border-slate-700/50">
            <CardContent className="py-4 text-sm text-slate-500">
              Scores and feedback are shown after the interview ends — focus on answering each question naturally.
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
