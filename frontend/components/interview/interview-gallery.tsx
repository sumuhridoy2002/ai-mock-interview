"use client";

import { useEffect, useState } from "react";
import { Camera, ImageOff } from "lucide-react";
import { API_URL } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { AggregateBehaviorCard, type AggregateBehavior } from "@/components/interview/behavior-card";
import { frameBorderClass, type FrameScore } from "@/lib/scoring/behavior";

interface QuestionSnap {
  sequence: number;
  question: string;
  answerId: number;
  snapshotCount: number;
  snapshotBehavior?: {
    frame_scores?: FrameScore[];
  } | null;
}

interface SnapshotItem {
  filename: string;
  data_url: string;
}

interface FlatSnapshot {
  key: string;
  item: SnapshotItem;
  sequence: number;
  question: string;
  frameScore?: FrameScore;
}

interface Props {
  interviewId: string | number;
  questions: QuestionSnap[];
  overallBehavior?: AggregateBehavior | null;
}

function SnapshotThumb({
  item,
  frameScore,
  sequence,
  onClick,
}: {
  item: SnapshotItem;
  frameScore?: FrameScore;
  sequence: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm ${frameBorderClass(frameScore)}`}
    >
      <img
        src={item.data_url}
        alt={item.filename}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent px-1.5 py-1">
        <p className="text-[10px] text-white/90 font-medium truncate">Q{sequence}</p>
      </div>
    </button>
  );
}

function OverallSuggestions({ summary }: { summary: AggregateBehavior }) {
  const items =
    summary.suggestions && summary.suggestions.length > 0
      ? summary.suggestions
      : summary.coaching_narrative
        ? summary.coaching_narrative
            .split(/(?<=[.!?])\s+/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border border-purple-200 dark:border-purple-500/30 bg-purple-50/40 dark:bg-purple-950/10 p-4 space-y-2">
      <p className="text-sm font-semibold text-foreground">Overall suggestions</p>
      <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-4">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function InterviewGallery({ interviewId, questions, overallBehavior }: Props) {
  const [flatSnapshots, setFlatSnapshots] = useState<FlatSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const totalSnaps = questions.reduce((s, q) => s + q.snapshotCount, 0);

  useEffect(() => {
    const withSnaps = questions.filter((q) => q.snapshotCount > 0);
    if (withSnaps.length === 0) {
      setFlatSnapshots([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadAll() {
      setLoading(true);
      setError(null);
      const token = getToken();
      const flat: FlatSnapshot[] = [];

      await Promise.all(
        withSnaps.map(async (q) => {
          try {
            const res = await fetch(
              `${API_URL}/interviews/${interviewId}/answers/${q.answerId}/snapshots`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  Accept: "application/json",
                },
              },
            );
            if (!res.ok) return;
            const data: { snapshots: SnapshotItem[] } = await res.json();
            const frameScores = q.snapshotBehavior?.frame_scores ?? [];
            (data.snapshots ?? []).forEach((item, i) => {
              flat.push({
                key: `${q.answerId}-${item.filename}`,
                item,
                sequence: q.sequence,
                question: q.question,
                frameScore: frameScores[i],
              });
            });
          } catch {
            // skip failed answer
          }
        }),
      );

      flat.sort((a, b) => a.sequence - b.sequence || a.item.filename.localeCompare(b.item.filename));

      if (!cancelled) {
        setFlatSnapshots(flat);
        if (flat.length === 0 && totalSnaps > 0) {
          setError("Could not load snapshots.");
        }
        setLoading(false);
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [interviewId, questions, totalSnaps]);

  if (questions.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">
        No questions found in this interview.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {overallBehavior && totalSnaps > 0 && (
        <AggregateBehaviorCard summary={overallBehavior} />
      )}

      {overallBehavior && totalSnaps > 0 && (
        <OverallSuggestions summary={overallBehavior} />
      )}

      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Camera className="h-4 w-4" />
        {totalSnaps > 0
          ? `${totalSnaps} snapshot${totalSnaps !== 1 ? "s" : ""} · green = good presence, red = needs attention`
          : `No snapshots stored (${questions.length} questions)`}
      </div>

      {totalSnaps === 0 ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <ImageOff className="h-4 w-4" />
          No snapshots were captured during this interview.
        </div>
      ) : loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-3">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-border border-t-primary" />
          Loading snapshots…
        </div>
      ) : error ? (
        <p className="text-xs text-amber-600 dark:text-amber-400 py-2">{error}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {flatSnapshots.map((snap) => (
            <SnapshotThumb
              key={snap.key}
              item={snap.item}
              frameScore={snap.frameScore}
              sequence={snap.sequence}
              onClick={() => setLightbox(snap.item.data_url)}
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
