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

function snapshotStreamUrl(
  interviewId: string | number,
  answerId: number,
  filename: string,
): string {
  return `${API_URL}/interviews/${interviewId}/answers/${answerId}/snapshots/${encodeURIComponent(filename)}`;
}

function parseFilenames(entries: string[]): string[] {
  return entries.map((entry) => {
    if (entry.startsWith("http://") || entry.startsWith("https://")) {
      return decodeURIComponent(entry.split("/").pop() ?? entry);
    }
    return entry;
  });
}

async function fetchSnapshotBlob(
  interviewId: string | number,
  answerId: number,
  filename: string,
): Promise<Blob | null> {
  const token = getToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(snapshotStreamUrl(interviewId, answerId, filename), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function QuestionSnapGroup({ interviewId, q }: { interviewId: string | number; q: QuestionSnap }) {
  const [blobUrls, setBlobUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (q.snapshotCount === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const objectUrls: string[] = [];

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
          if (!cancelled) setError("Could not load snapshot list.");
          return;
        }

        const data: { snapshots: string[] } = await res.json();
        const filenames = parseFilenames(data.snapshots ?? []);

        if (filenames.length === 0) {
          if (!cancelled) setError("No snapshot files found.");
          return;
        }

        const blobs = await Promise.all(
          filenames.map((filename) => fetchSnapshotBlob(interviewId, q.answerId, filename)),
        );

        const validBlobs = blobs.filter((b): b is Blob => b !== null);
        if (validBlobs.length === 0) {
          if (!cancelled) setError("Snapshots could not be downloaded.");
          return;
        }

        for (const blob of validBlobs) {
          objectUrls.push(URL.createObjectURL(blob));
        }

        if (!cancelled) setBlobUrls(objectUrls);
      } catch {
        if (!cancelled) setError("Failed to load snapshots.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
      objectUrls.forEach(URL.revokeObjectURL);
    };
  }, [interviewId, q.answerId, q.snapshotCount]);

  useEffect(() => {
    return () => {
      blobUrls.forEach(URL.revokeObjectURL);
    };
  }, [blobUrls]);

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
      ) : error ? (
        <p className="text-xs text-amber-500/90 py-2">{error}</p>
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
        {totalSnaps > 0
          ? `${totalSnaps} snapshot${totalSnaps !== 1 ? "s" : ""} across ${questions.length} question${questions.length !== 1 ? "s" : ""}`
          : `No snapshots stored for this interview (${questions.length} question${questions.length !== 1 ? "s" : ""})`}
      </div>

      <div className="space-y-8">
        {questions.map((q) => (
          <QuestionSnapGroup key={q.answerId} interviewId={interviewId} q={q} />
        ))}
      </div>
    </div>
  );
}
