export interface MetricDoc {
  id: string;
  title: string;
  formula: string;
  description: string;
  ratingBands: string;
  referenceUrl?: string;
  referenceLabel?: string;
}

export function getMetricDoc(id: string): MetricDoc | undefined {
  return PERFORMANCE_METRIC_DOCS.find((doc) => doc.id === id);
}

export const PERFORMANCE_METRIC_DOCS: MetricDoc[] = [
  {
    id: "systemPerformanceScore",
    title: "System Performance Score",
    formula: "100 − page-load penalties − API penalties − 30 if API offline",
    description:
      "Composite score from page load time, Laravel API round-trip, and API reachability. Starts at 100 and subtracts penalties for slow loads (>800ms, >1500ms, >3000ms), slow API (>300ms, >800ms, >2000ms), and −30 when the API is unreachable.",
    ratingBands: "Good ≥ 85% · OK ≥ 65% · Slow < 65%",
  },
  {
    id: "pageLoad",
    title: "Page load",
    formula: "loadEventEnd − navigationStart",
    description: "Full page load time using the Navigation Timing API. Measures from navigation start until the load event completes.",
    ratingBands: "Good < 800 ms · OK < 1500 ms · Slow ≥ 1500 ms",
    referenceUrl: "https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Navigation_timing",
    referenceLabel: "MDN — Navigation Timing",
  },
  {
    id: "domReady",
    title: "DOM ready",
    formula: "domContentLoadedEventEnd − navigationStart",
    description: "Time until the HTML document is parsed and the DOM is ready, before images and subresources finish loading.",
    ratingBands: "Good < 600 ms · OK < 1200 ms · Slow ≥ 1200 ms",
    referenceUrl: "https://developer.mozilla.org/en-US/docs/Web/API/Document/DOMContentLoaded_event",
    referenceLabel: "MDN — DOMContentLoaded",
  },
  {
    id: "apiLatency",
    title: "API round-trip",
    formula: "TTFB + server processing + body transfer  (Resource Timing API)",
    description: "Authenticated probe to GET /user. Uses the browser's Resource Timing API to split into: network overhead (ping baseline), time-to-first-byte (TTFB = server processing + network), and body transfer. Repeat probes send If-None-Match and receive a 304 if the user record is unchanged, which skips the response body.",
    ratingBands: "Good < 200 ms · OK < 800 ms · Slow ≥ 800 ms",
    referenceUrl: "https://www.w3.org/TR/resource-timing/",
    referenceLabel: "W3C — Resource Timing",
  },
  {
    id: "contextBytes",
    title: "App data size",
    formula: "localStorage + sessionStorage + last /user API payload",
    description: "Meaningful application-stored data only. JS heap is excluded — it is Next.js runtime memory (~15–20 MB) and not related to what the app explicitly stores. localStorage holds auth token, cached user profile, and up to 30 performance history samples (~5–10 KB total).",
    ratingBands: "Good < 100 KB · OK < 500 KB · Slow ≥ 500 KB",
    referenceUrl: "https://developer.mozilla.org/en-US/docs/Web/API/Storage",
    referenceLabel: "MDN — Storage API",
  },
  {
    id: "renderMs",
    title: "Panel render",
    formula: "performance.now() after refresh − refresh start",
    description: "Time for one full monitor refresh cycle: read timings, probe API, measure context, and update comparisons.",
    ratingBands: "Informational only — not scored",
  },
];
