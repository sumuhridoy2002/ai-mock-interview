import { getBenchmarkForDoc, getFormulaDoc } from "@/lib/scoring-docs";

export type PerformanceRating = "good" | "ok" | "slow";

export function rateMetric(value: number, docId: string): PerformanceRating {
  const benchmark = getBenchmarkForDoc(docId);
  if (!benchmark) return "ok";

  if (benchmark.unit === "%" || benchmark.higherIsBetter) {
    if (value >= benchmark.goodMax) return "good";
    if (value >= benchmark.okMax) return "ok";
    return "slow";
  }

  if (value <= benchmark.goodMax) return "good";
  if (value <= benchmark.okMax) return "ok";
  return "slow";
}

export function ratingLabel(rating: PerformanceRating): string {
  if (rating === "good") return "Good";
  if (rating === "ok") return "OK";
  return "Slow";
}

export function ratingClass(rating: PerformanceRating): string {
  if (rating === "good") return "text-emerald-600 dark:text-emerald-400";
  if (rating === "ok") return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

export function ratingBadgeClass(rating: PerformanceRating): string {
  if (rating === "good") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
  if (rating === "ok") return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
  return "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30";
}

export function targetLabel(docId: string): string {
  const doc = getFormulaDoc(docId);
  return doc?.industryStandard ?? doc?.ratingBands ?? "";
}

export function meetsStandard(value: number, docId: string): boolean | null {
  const benchmark = getBenchmarkForDoc(docId);
  if (!benchmark) return null;
  if (benchmark.unit === "%" || benchmark.higherIsBetter) {
    return value >= benchmark.goodMax;
  }
  return value <= benchmark.goodMax;
}

export interface MetricDelta {
  value: number;
  direction: "up" | "down" | "same";
  formatted: string;
  improved: boolean | null;
}

export function computeDelta(
  current: number | null,
  previous: number | null,
  higherIsBetter = false,
): MetricDelta | null {
  if (current === null || previous === null) return null;

  const diff = current - previous;
  if (diff === 0) {
    return { value: 0, direction: "same", formatted: "no change", improved: null };
  }

  const direction = diff > 0 ? "up" : "down";
  const improved = higherIsBetter ? diff > 0 : diff < 0;
  const abs = Math.abs(diff);

  return {
    value: diff,
    direction,
    improved,
    formatted: `${direction === "up" ? "↑" : "↓"} ${abs}`,
  };
}

/** @deprecated Use rateMetric(value, docId) — kept for gradual migration */
export const PERFORMANCE_BENCHMARKS = {
  pageLoad: { targetLabel: targetLabel("pageLoad") },
  domReady: { targetLabel: targetLabel("domReady") },
  apiLatency: { targetLabel: targetLabel("apiLatency") },
  contextBytes: { targetLabel: targetLabel("contextBytes") },
  systemPerformanceScore: { targetLabel: targetLabel("systemPerformanceScore") },
} as const;
