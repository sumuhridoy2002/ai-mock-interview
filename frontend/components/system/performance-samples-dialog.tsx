"use client";

import { useEffect, useRef } from "react";
import { X, Info, Database } from "lucide-react";
import {
  PERFORMANCE_HISTORY_MAX_SAMPLES,
  type PerformanceSample,
  type SessionAverages,
} from "@/lib/performance-history";
import { SYSTEM_MONITOR_REFRESH_SECONDS } from "@/hooks/useSystemMetrics";
import { cn, formatBytes } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  samples: PerformanceSample[];
  averages: SessionAverages;
}

function formatSampleTime(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function PerformanceSamplesDialog({ open, onClose, samples, averages }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const ordered = [...samples].reverse();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="perf-samples-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border bg-gradient-to-r from-indigo-500/10 to-violet-500/10 px-5 py-4">
          <div>
            <h2 id="perf-samples-title" className="text-lg font-bold text-foreground flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Session samples ({averages.sampleCount} of {PERFORMANCE_HISTORY_MAX_SAMPLES})
            </h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
              Rolling history of performance probes stored in your browser — used to compute session averages and
              &quot;vs last refresh&quot; deltas.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-5">
          {/* How it works */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Info className="h-4 w-4 text-primary" />
              How samples are collected
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground list-disc pl-5">
              <li>
                Each <strong className="text-foreground">refresh</strong> (manual or auto every{" "}
                {SYSTEM_MONITOR_REFRESH_SECONDS}s while this tab is visible) runs page-load, API, and storage probes.
              </li>
              <li>
                One snapshot is appended to <code className="text-xs bg-muted px-1 py-0.5 rounded">localStorage</code>{" "}
                key <code className="text-xs bg-muted px-1 py-0.5 rounded">mip_perf_history</code>.
              </li>
              <li>
                Only the latest <strong className="text-foreground">{PERFORMANCE_HISTORY_MAX_SAMPLES} samples</strong>{" "}
                are kept (FIFO — oldest dropped when full).
              </li>
              <li>
                <strong className="text-foreground">Session average</strong> = arithmetic mean of score, page load, API,
                and app data across all stored samples.
              </li>
            </ul>
          </div>

          {/* Averages summary */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Avg score", value: `${averages.performanceScore}%` },
              { label: "Avg page load", value: `${averages.pageLoadMs} ms` },
              {
                label: "Avg API",
                value: averages.apiLatencyMs != null ? `${averages.apiLatencyMs} ms` : "—",
              },
              { label: "Avg app data", value: formatBytes(averages.contextBytes) },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</p>
                <p className="mt-1 font-mono text-base font-bold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Sample table */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-2">All samples (newest first)</h3>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-3 py-2 font-semibold text-foreground">#</th>
                    <th className="px-3 py-2 font-semibold text-foreground">Time</th>
                    <th className="px-3 py-2 font-semibold text-foreground">Score</th>
                    <th className="px-3 py-2 font-semibold text-foreground">Page load</th>
                    <th className="px-3 py-2 font-semibold text-foreground">API</th>
                    <th className="px-3 py-2 font-semibold text-foreground">DOM ready</th>
                    <th className="px-3 py-2 font-semibold text-foreground">App data</th>
                  </tr>
                </thead>
                <tbody>
                  {ordered.map((sample, i) => {
                    const index = samples.length - i;
                    const isLatest = i === 0;

                    return (
                      <tr
                        key={sample.ts}
                        className={cn(
                          "border-b border-border/70 last:border-0",
                          i % 2 === 1 && "bg-muted/15",
                          isLatest && "bg-primary/5",
                        )}
                      >
                        <td className="px-3 py-2 font-mono text-muted-foreground">
                          {index}
                          {isLatest && (
                            <span className="ml-1 rounded bg-primary/15 px-1.5 py-0.5 text-xs font-bold text-primary">
                              latest
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-foreground whitespace-nowrap">{formatSampleTime(sample.ts)}</td>
                        <td className="px-3 py-2 font-mono font-medium text-foreground">{sample.performanceScore}%</td>
                        <td className="px-3 py-2 font-mono text-foreground">{sample.pageLoadMs} ms</td>
                        <td className="px-3 py-2 font-mono text-foreground">
                          {sample.apiLatencyMs != null ? `${sample.apiLatencyMs} ms` : "—"}
                        </td>
                        <td className="px-3 py-2 font-mono text-foreground">{sample.domReadyMs} ms</td>
                        <td className="px-3 py-2 font-mono text-foreground">{formatBytes(sample.contextBytes)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="border-t border-border px-5 py-3 flex justify-end bg-muted/20">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
