"use client";

import { useEffect, useState } from "react";
import { Camera, ImageOff, Brain } from "lucide-react";
import { API_URL } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { BehaviorPanel, type BehaviorData } from "@/components/interview/behavior-card";
import { AggregateBehaviorCard, type AggregateBehavior } from "@/components/interview/behavior-card";

export interface FrameScore {
  face_detected?: boolean;
  confidence?: number;
  nervousness?: number;
  dominant_emotion?: string;
  eye_contact?: number;
}

export interface SnapshotBehavior extends BehaviorData {
  frame_scores?: FrameScore[];
  snapshots_count?: number;
}

interface QuestionSnap {
  sequence: number;
  question: string;
  answerId: number;
  snapshotCount: number;
  snapshotBehavior?: SnapshotBehavior | null;
}

interface SnapshotItem {
  filename: string;
  data_url: string;
}

interface Props {
  interviewId: string | number;
  questions: QuestionSnap[];
  overallBehavior?: AggregateBehavior | null;
}

function SnapshotThumb({
  item,
  frameScore,
  onClick,
}: {
  item: SnapshotItem;
  frameScore?: FrameScore;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative aspect-square rounded-lg overflow-hidden border border-slate-700 hover:border-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <img
        src={item.data_url}
        alt={item.filename}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      {frameScore?.face_detected && frameScore.confidence != null && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-1.5 py-1.5 pt-4">
          <p className="text-[10px] text-emerald-300 font-semibold leading-tight">
            {frameScore.confidence}% confident
          </p>
          <p className="text-[9px] text-red-300/90 leading-tight">
            {frameScore.nervousness}% nervous
          </p>
          {frameScore.dominant_emotion && (
            <p className="text-[9px] text-slate-400 capitalize truncate">
              {frameScore.dominant_emotion}
            </p>
          )}
        </div>
      )}
      {frameScore && !frameScore.face_detected && (
        <div className="absolute inset-x-0 bottom-0 bg-black/70 px-1 py-0.5">
          <p className="text-[9px] text-slate-500">No face detected</p>
        </div>
      )}
    </button>
  );
}

function QuestionSnapGroup({ interviewId, q }: { interviewId: string | number; q: QuestionSnap }) {
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (q.snapshotCount === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = getToken();
        const res = await fetch(
          `${API_URL}/interviews/${interviewId}/answers/${q.answerId}/snapshots`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          },
        );

        if (!res.ok) {
          if (!cancelled) setError("Could not load snapshots.");
          return;
        }

        const data: { snapshots: SnapshotItem[] } = await res.json();
        if (!cancelled) {
          setSnapshots(data.snapshots ?? []);
          if ((data.snapshots ?? []).length === 0) {
            setError("No snapshot files found on server.");
          }
        }
      } catch {
        if (!cancelled) setError("Failed to load snapshots.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [interviewId, q.answerId, q.snapshotCount]);

  const behaviorForPanel: BehaviorData | null = q.snapshotBehavior
    ? {
        confidence: q.snapshotBehavior.confidence,
        nervousness: q.snapshotBehavior.nervousness,
        eye_contact_ratio: q.snapshotBehavior.eye_contact_ratio,
        head_stability: q.snapshotBehavior.head_stability,
        blink_rate: q.snapshotBehavior.blink_rate,
        emotion_distribution: q.snapshotBehavior.emotion_distribution,
        coaching_narrative: q.snapshotBehavior.coaching_narrative,
      }
    : null;

  const frameScores = q.snapshotBehavior?.frame_scores ?? [];

  return (
    <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/30 p-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500 mb-0.5">
          Question {q.sequence}
        </p>
        <p className="text-sm text-slate-300">{q.question}</p>
      </div>

      {behaviorForPanel && q.snapshotBehavior?.frames_analyzed ? (
        <BehaviorPanel behavior={behaviorForPanel} />
      ) : q.snapshotCount > 0 && !loading ? (
        <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
          <Brain className="h-3.5 w-3.5" />
          Behaviour analysis pending — refresh in a moment
        </div>
      ) : null}

      {q.snapshotCount === 0 ? (
        <div className="flex items-center gap-2 text-xs text-slate-600 py-2">
          <ImageOff className="h-4 w-4" />
          No snapshots captured for this answer
        </div>
      ) : loading ? (
        <div className="flex items-center gap-2 text-xs text-slate-500 py-3">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-600 border-t-indigo-400" />
          Loading {q.snapshotCount} snapshot{q.snapshotCount !== 1 ? "s" : ""}…
        </div>
      ) : error ? (
        <p className="text-xs text-amber-500/90 py-2">{error}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {snapshots.map((item, i) => (
            <SnapshotThumb
              key={item.filename}
              item={item}
              frameScore={frameScores[i]}
              onClick={() => setLightbox(item.data_url)}
            />
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="Snapshot"
            className="max-w-full max-h-full rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl leading-none"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export function InterviewGallery({ interviewId, questions, overallBehavior }: Props) {
  const totalSnaps = questions.reduce((s, q) => s + q.snapshotCount, 0);

  if (questions.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500 text-sm">
        No questions found in this interview.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {overallBehavior && totalSnaps > 0 && (
        <AggregateBehaviorCard summary={overallBehavior} />
      )}

      <div className="flex items-center gap-2 text-slate-400 text-sm">
        <Camera className="h-4 w-4" />
        {totalSnaps > 0
          ? `${totalSnaps} snapshot${totalSnaps !== 1 ? "s" : ""} · scores shown on each image`
          : `No snapshots stored (${questions.length} questions)`}
      </div>

      <div className="space-y-4">
        {questions.map((q) => (
          <QuestionSnapGroup key={q.answerId} interviewId={interviewId} q={q} />
        ))}
      </div>
    </div>
  );
}
