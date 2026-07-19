"use client";

import { cn } from "@/lib/utils";
import {
  ratingBadgeClass,
  ratingClass,
  ratingLabel,
  type PerformanceRating,
} from "@/lib/performance-benchmarks";

const RING_COLORS: Record<PerformanceRating, string> = {
  good: "#10b981",
  ok: "#f59e0b",
  slow: "#f43f5e",
};

interface SystemPerformanceGaugeProps {
  score: number;
  rating: PerformanceRating;
  targetLabel?: string;
  /** sm = dashboard card, lg = metrics page */
  size?: "sm" | "lg";
  /** Light text/ring for purple hero backgrounds */
  onDark?: boolean;
  className?: string;
}

export function SystemPerformanceGauge({
  score,
  rating,
  targetLabel = "≥ 85% indicates a healthy composite score",
  size = "lg",
  onDark = false,
  className,
}: SystemPerformanceGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const ringColor = RING_COLORS[rating];
  const dim = size === "lg" ? "h-36 w-36" : "h-28 w-28";
  const innerDim = size === "lg" ? "h-[7.5rem] w-[7.5rem]" : "h-[5.75rem] w-[5.75rem]";
  const scoreText = size === "lg" ? "text-3xl" : "text-2xl";
  const trackColor = onDark ? "rgba(255,255,255,0.2)" : "var(--muted)";

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div
        className={cn("relative flex shrink-0 items-center justify-center rounded-full", dim)}
        style={{
          background: `conic-gradient(${ringColor} ${clamped}%, ${trackColor} ${clamped}%)`,
        }}
      >
        <div
          className={cn(
            "flex flex-col items-center justify-center rounded-full shadow-inner ring-1",
            innerDim,
            onDark
              ? "bg-indigo-950/70 ring-white/20 text-white"
              : "bg-card ring-border",
          )}
        >
          <span
            className={cn(
              "font-bold font-mono leading-none tracking-tight",
              scoreText,
              onDark ? "text-white" : ratingClass(rating),
            )}
          >
            {clamped}
            <span className={cn("text-sm font-semibold", onDark ? "text-white/70" : "text-muted-foreground")}>
              %
            </span>
          </span>
        </div>
      </div>

      {!onDark && (
        <div className="text-center space-y-1.5 max-w-xs">
          <p className="text-sm font-semibold text-foreground">System Performance Score</p>
          <span
            className={cn(
              "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide",
              ratingBadgeClass(rating),
            )}
          >
            {ratingLabel(rating)}
          </span>
          {targetLabel && (
            <p className="text-xs text-muted-foreground leading-snug">{targetLabel}</p>
          )}
        </div>
      )}
    </div>
  );
}
