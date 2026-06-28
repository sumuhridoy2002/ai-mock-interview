"use client";

import { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import { API_URL } from "@/lib/api";
import { getToken } from "@/lib/auth";

interface Props {
  interviewId: string | number;
  answerId: number;
  snapshotCount: number;
}

export function AnswerSnapshotsGallery({ interviewId, answerId, snapshotCount }: Props) {
  const [blobUrls, setBlobUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded || blobUrls.length > 0 || snapshotCount === 0) return;

    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        const res = await fetch(
          `${API_URL}/interviews/${interviewId}/answers/${answerId}/snapshots`,
          { headers: { Authorization: `Bearer ${getToken()}`, Accept: "application/json" } }
        );
        if (!res.ok || cancelled) return;
        const data: { snapshots: string[] } = await res.json();

        const urls = await Promise.all(
          data.snapshots.map(async (url) => {
            const imgRes = await fetch(url, {
              headers: { Authorization: `Bearer ${getToken()}` },
            });
            const blob = await imgRes.blob();
            return URL.createObjectURL(blob);
          })
        );

        if (!cancelled) setBlobUrls(urls);
      } catch {
        // non-critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [expanded, interviewId, answerId, snapshotCount, blobUrls.length]);

  // Clean up blob URLs on unmount
  useEffect(() => {
    return () => { blobUrls.forEach(URL.revokeObjectURL); };
  }, [blobUrls]);

  if (snapshotCount === 0) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
      >
        <Camera className="h-3.5 w-3.5" />
        {expanded ? "Hide" : "Show"} {snapshotCount} captured snapshot{snapshotCount !== 1 ? "s" : ""}
      </button>

      {expanded && (
        <div className="mt-3">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-slate-500 py-3">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-600 border-t-indigo-400" />
              Loading snapshots…
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {blobUrls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <img
                    src={url}
                    alt={`Snapshot ${i + 1}`}
                    className="h-28 w-auto rounded-md border border-slate-700 object-cover hover:border-indigo-500 transition-colors cursor-zoom-in"
                  />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
