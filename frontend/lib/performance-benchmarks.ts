export type PerformanceRating = "good" | "ok" | "slow";

export interface MetricBenchmark {
  label: string;
  goodMax: number;
  okMax: number;
  unit: string;
  targetLabel: string;
}

export const PERFORMANCE_BENCHMARKS = {
  pageLoad: {
    label: "Page load",
    goodMax: 800,
    okMax: 1500,
    unit: "ms",
    targetLabel: "< 800 ms",
  },
  domReady: {
    label: "DOM ready",
    goodMax: 600,
    okMax: 1200,
    unit: "ms",
    targetLabel: "< 600 ms",
  },
  apiLatency: {
    label: "API latency",
    goodMax: 200,
    okMax: 800,
    unit: "ms",
    targetLabel: "< 200 ms",
  },
  contextBytes: {
    label: "Context size",
    goodMax: 5 * 1024 * 1024,
    okMax: 20 * 1024 * 1024,
    unit: "bytes",
    targetLabel: "< 5 MB",
  },
  jsHeap: {
    label: "JS heap",
    goodMax: 50 * 1024 * 1024,
    okMax: 100 * 1024 * 1024,
    unit: "bytes",
    targetLabel: "< 50 MB",
  },
  healthScore: {
    label: "Health score",
    goodMax: 85,
    okMax: 65,
    unit: "%",
    targetLabel: "≥ 85%",
  },
} as const satisfies Record<string, MetricBenchmark>;

export function rateMetric(value: number, benchmark: MetricBenchmark): PerformanceRating {
  if (benchmark.unit === "%") {
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
  if (rating === "good") return "text-emerald-400";
  if (rating === "ok") return "text-amber-400";
  return "text-rose-400";
}

export function ratingBadgeClass(rating: PerformanceRating): string {
  if (rating === "good") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  if (rating === "ok") return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  return "bg-rose-500/15 text-rose-300 border-rose-500/30";
}

export interface MetricDelta {
  value: number;
  direction: "up" | "down" | "same";
  formatted: string;
  improved: boolean | null;
}

/** For latency/size metrics, lower is better. For score %, higher is better. */
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
