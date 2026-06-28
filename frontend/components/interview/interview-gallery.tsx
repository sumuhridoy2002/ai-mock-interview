"use client";

import { useEffect, useState } from "react";
import { Camera, ImageOff } from "lucide-react";
import { API_URL } from "@/lib/api";
import { getToken } from "@/lib/auth";

interface QuestionSnap {
  sequence: number;
  question: string;
  answerId: number;
  snapshotCount: number;
}

interface Props {
  interviewId: string | number;
  questions: QuestionSnap[];
}

function QuestionSnapGroup({ interviewId, q }: { interviewId: string | number; q: QuestionSnap }) {
  const [blobUrls, setBlobUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (q.snapshotCount === 0) { setLoading(false); return; }
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(
          `${API_URL}/interviews/${interviewId}/answers/${q.answerId}/snapshots`,
          { headers: { Authorization: `Bearer ${getToken()}`, Accept: "application/json" } }
        );
        if (!res.ok || cancelled) return;
        const data: { snapshots: string[] } = await res.json();

        const urls = await Promise.all(
          data.snapshots.map(async (url) => {
            const r = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
            return URL.createObjectURL(await r.blob());
          })
        );
        if (!cancelled) setBlobUrls(urls);
      } catch { /* non-critical */ }
      finally { if (!cancelled) setLoading(false); }
    }

    load();
    return () => { cancelled = true; };
  }, [interviewId, q.answerId, q.snapshotCount]);

  useEffect(() => () => { blobUrls.forEach(URL.revokeObjectURL); }, [blobUrls]);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500 mb-0.5">Question {q.sequence}</p>
        <p className="text-sm text-slate-300 line-clamp-2">{q.question}</p>
      </div>

      {q.snapshotCount === 0 ? (
        <div className="flex items-center gap-2 text-xs text-slate-600 py-3">
          <ImageOff className="h-4 w-4" />
          No snapshots captured for this answer
        </div>
      ) : loading ? (
        <div className="flex items-center gap-2 text-xs text-slate-500 py-3">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-600 border-t-indigo-400" />
          Loading {q.snapshotCount} snapshot{q.snapshotCount !== 1 ? "s" : ""}…
        </div>
      ) : blobUrls.length === 0 ? (
        <p className="text-xs text-slate-600 py-2">Snapshots unavailable</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {blobUrls.map((url, i) => (
            <button
              key={i}
              onClick={() => setLightbox(url)}
              className="aspect-square rounded-lg overflow-hidden border border-slate-700 hover:border-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <img src={url} alt={`Q${q.sequence} snapshot ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="Snapshot"
            className="max-w-full max-h-full rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
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

export function InterviewGallery({ interviewId, questions }: Props) {
  const withSnaps = questions.filter((q) => q.snapshotCount > 0);
  const totalSnaps = questions.reduce((s, q) => s + q.snapshotCount, 0);

  if (questions.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500 text-sm">
        No questions found in this interview.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
        <Camera className="h-4 w-4" />
        {totalSnaps} snapshot{totalSnaps !== 1 ? "s" : ""} captured across {withSnaps.length} answer{withSnaps.length !== 1 ? "s" : ""}
      </div>

      <div className="space-y-8">
        {questions.map((q) => (
          <QuestionSnapGroup key={q.answerId} interviewId={interviewId} q={q} />
        ))}
      </div>
    </div>
  );
}
