export {
  rateMetric,
  ratingLabel,
  ratingClass,
  ratingBadgeClass,
  computeDelta,
  targetLabel,
  meetsStandard,
  type PerformanceRating,
  type MetricDelta,
} from "./scoring/benchmarks";

import { targetLabel } from "./scoring/benchmarks";

export const PERFORMANCE_BENCHMARKS = {
  pageLoad: { label: "Page load", goodMax: 800, okMax: 1500, unit: "ms", targetLabel: targetLabel("pageLoad"), referenceUrl: "https://web.dev/articles/vitals" },
  domReady: { label: "DOM ready", goodMax: 600, okMax: 1200, unit: "ms", targetLabel: targetLabel("domReady"), referenceUrl: "https://developer.mozilla.org/en-US/docs/Web/API/Document/DOMContentLoaded_event" },
  apiLatency: { label: "API latency", goodMax: 200, okMax: 800, unit: "ms", targetLabel: targetLabel("apiLatency"), referenceUrl: "https://www.w3.org/TR/resource-timing/" },
  contextBytes: { label: "App data size", goodMax: 102400, okMax: 512000, unit: "bytes", targetLabel: targetLabel("contextBytes"), referenceUrl: "https://developer.mozilla.org/en-US/docs/Web/API/Storage" },
  systemPerformanceScore: { label: "System Performance Score", goodMax: 85, okMax: 65, unit: "%", targetLabel: targetLabel("systemPerformanceScore") },
  jsHeap: { label: "JS heap", goodMax: 52428800, okMax: 104857600, unit: "bytes", targetLabel: "< 50 MB", referenceUrl: "https://developer.chrome.com/docs/devtools/memory-problems/" },
} as const;

export const BENCHMARK_DOC_IDS: Record<keyof typeof PERFORMANCE_BENCHMARKS, string> = {
  pageLoad: "pageLoad",
  domReady: "domReady",
  apiLatency: "apiLatency",
  contextBytes: "contextBytes",
  systemPerformanceScore: "systemPerformanceScore",
  jsHeap: "contextBytes",
};
