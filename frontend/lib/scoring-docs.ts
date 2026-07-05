import SCORING_CONSTANTS from "./scoring/constants";

export interface FormulaReference {
  label: string;
  url: string;
}

export interface FormulaBenchmark {
  goodMax: number;
  okMax: number;
  unit: string;
  higherIsBetter?: boolean;
}

export interface FormulaDoc {
  id: string;
  title: string;
  formula: string;
  description: string;
  industryStandard: string;
  ratingBands: string;
  benchmarks?: FormulaBenchmark;
  references: FormulaReference[];
}

const SM = SCORING_CONSTANTS.systemMetrics;
const PAGE_P = SM.pageLoad.penalties;
const API_P = SM.apiLatency.penalties;

/** Metrics shown on /system/metrics — used for the formula reference table. */
export const METRICS_PAGE_FORMULA_IDS = [
  "systemPerformanceScore",
  "pageLoad",
  "apiLatency",
  "contextBytes",
  "domReady",
  "renderMs",
] as const;

export const FORMULA_DOCS: FormulaDoc[] = [
  {
    id: "apiLatency",
    title: "API round-trip",
    formula: [
      "apiLatencyMs = round(t_end − t_start)",
      "t_start = performance.now() immediately before fetch(GET /api/v1/user)",
      "t_end = performance.now() immediately after response headers arrive",
      "TTFB = entry.responseStart − entry.startTime  (Resource Timing)",
      "transferMs = entry.responseEnd − entry.responseStart",
    ].join("\n"),
    description:
      "Authenticated probe to GET /user with Bearer token. Optional If-None-Match ETag for 304 responses. Ping (GET /ping) is measured separately and is not included in this score.",
    industryStandard: "< 200 ms is the standard good API response time (W3C / web.dev TTFB guidance)",
    ratingBands: "Good < 200 ms · OK < 800 ms · Slow ≥ 800 ms",
    benchmarks: { goodMax: 200, okMax: 800, unit: "ms" },
    references: [
      { label: "W3C — Resource Timing Level 2", url: "https://www.w3.org/TR/resource-timing-2/" },
      { label: "web.dev — Time to First Byte (TTFB)", url: "https://web.dev/articles/ttfb" },
      { label: "MDN — PerformanceResourceTiming", url: "https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming" },
    ],
  },
  {
    id: "pageLoad",
    title: "Page load",
    formula: [
      "pageLoadMs = timing.loadEventEnd − timing.navigationStart",
      "Uses window.performance.timing (Navigation Timing API)",
    ].join("\n"),
    description: "Full document load from navigation start until the load event completes.",
    industryStandard: "< 800 ms good · < 2.5 s LCP target (Google Core Web Vitals)",
    ratingBands: "Good < 800 ms · OK < 1500 ms · Slow ≥ 1500 ms",
    benchmarks: { goodMax: 800, okMax: 1500, unit: "ms" },
    references: [
      { label: "web.dev — Core Web Vitals", url: "https://web.dev/articles/vitals" },
      { label: "MDN — Navigation Timing API", url: "https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Navigation_timing" },
      { label: "W3C — Navigation Timing", url: "https://www.w3.org/TR/navigation-timing/" },
    ],
  },
  {
    id: "domReady",
    title: "DOM ready",
    formula: [
      "domReadyMs = timing.domContentLoadedEventEnd − timing.navigationStart",
      "Fires when HTML is parsed and DOM is ready (before images/stylesheets finish)",
    ].join("\n"),
    description: "Time until the DOM is interactive enough to bind UI.",
    industryStandard: "< 600 ms for an interactive application shell",
    ratingBands: "Good < 600 ms · OK < 1200 ms · Slow ≥ 1200 ms",
    benchmarks: { goodMax: 600, okMax: 1200, unit: "ms" },
    references: [
      { label: "MDN — DOMContentLoaded", url: "https://developer.mozilla.org/en-US/docs/Web/API/Document/DOMContentLoaded_event" },
      { label: "MDN — domContentLoadedEventEnd", url: "https://developer.mozilla.org/en-US/docs/Web/API/PerformanceTiming/domContentLoadedEventEnd" },
    ],
  },
  {
    id: "systemPerformanceScore",
    title: "System Performance Score",
    formula: [
      "score = clamp(100 − P_page − P_api − P_offline, 0, 100)",
      `P_page = pageLoadMs > ${PAGE_P[0]} ? 25 : pageLoadMs > ${PAGE_P[1]} ? 12 : pageLoadMs > ${PAGE_P[2]} ? 5 : 0`,
      `P_api = apiLatencyMs > ${API_P[0]} ? 20 : apiLatencyMs > ${API_P[1]} ? 10 : apiLatencyMs > ${API_P[2]} ? 4 : 0  (0 if apiLatencyMs is null)`,
      `P_offline = apiStatus ≠ "online" ? ${SM.performanceScore.offlinePenalty} : 0`,
      "clamp(x, 0, 100) = min(100, max(0, x))",
    ].join("\n"),
    description:
      "Composite 0–100 health score from Navigation Timing page load, authenticated /user round-trip, and API reachability. Implemented in computePerformanceScore().",
    industryStandard: `≥ ${SM.performanceScore.good}% indicates a healthy composite score`,
    ratingBands: `Good ≥ ${SM.performanceScore.good}% · OK ≥ ${SM.performanceScore.ok}% · Slow < ${SM.performanceScore.ok}%`,
    benchmarks: { goodMax: 85, okMax: 65, unit: "%", higherIsBetter: true },
    references: [
      { label: "web.dev — Core Web Vitals (load targets)", url: "https://web.dev/articles/vitals" },
      { label: "web.dev — Time to First Byte (API targets)", url: "https://web.dev/articles/ttfb" },
    ],
  },
  {
    id: "contextBytes",
    title: "App data size",
    formula: [
      "appDataBytes = localStorageBytes + sessionStorageBytes + apiResponseBytes",
      "storageBytes(S) = Σᵢ new Blob([keyᵢ, valueᵢ]).size  for each item in S",
      "apiResponseBytes = byte length of last full GET /user JSON body (304 → 0 added)",
    ].join("\n"),
    description:
      "Meaningful application-stored data only (auth token, cached user, metrics history). JS heap is excluded — it is runtime memory, not persisted app data.",
    industryStandard: "< 100 KB is standard for client-side application data",
    ratingBands: "Good < 100 KB · OK < 500 KB · Slow ≥ 500 KB",
    benchmarks: { goodMax: 102400, okMax: 512000, unit: "bytes" },
    references: [
      { label: "MDN — Storage API", url: "https://developer.mozilla.org/en-US/docs/Web/API/Storage" },
      { label: "MDN — Blob size", url: "https://developer.mozilla.org/en-US/docs/Web/API/Blob/size" },
    ],
  },
  {
    id: "answerPassThreshold",
    title: "Pass threshold",
    formula: "passed = score ≥ passThreshold",
    description: "Per-question pass bar for UI coloring and review cards.",
    industryStandard: `${SCORING_CONSTANTS.thresholds.pass}/100 pass bar (app standard)`,
    ratingBands: `Pass ≥ ${SCORING_CONSTANTS.thresholds.pass} · Below = needs improvement`,
    references: [
      { label: "App scoring constants", url: "https://github.com/mock-interview-pro/shared/scoring/constants.json" },
    ],
  },
  {
    id: "hiringRecommendation",
    title: "Hiring recommendation",
    formula: "tier from overall_score using hiring thresholds",
    description: "Maps overall interview score to strong_yes / yes / maybe / no / strong_no.",
    industryStandard: `≥ ${SCORING_CONSTANTS.thresholds.hiring.strong_yes} strong hire · ≥ ${SCORING_CONSTANTS.thresholds.hiring.yes} hire`,
    ratingBands: `Strong yes ≥ ${SCORING_CONSTANTS.thresholds.hiring.strong_yes} · Yes ≥ ${SCORING_CONSTANTS.thresholds.hiring.yes} · Maybe ≥ ${SCORING_CONSTANTS.thresholds.hiring.maybe}`,
    references: [
      { label: "SHRM — Interview assessment", url: "https://www.shrm.org/topics-tools/tools/hr-answers/behavioral-interview-questions" },
    ],
  },
  {
    id: "dashboardAvgScore",
    title: "Lifetime average score",
    formula: "round(sum(overall_score) / completed_interviews)",
    description: "Arithmetic mean of completed interview overall scores.",
    industryStandard: "Industry interviews often target ≥ 70 for hire-ready candidates",
    ratingBands: `Excellent ≥ ${SCORING_CONSTANTS.dashboard.gradeA} · Good ≥ ${SCORING_CONSTANTS.dashboard.gradeB}`,
    references: [
      { label: "App scoring constants", url: "https://github.com/mock-interview-pro/shared/scoring/constants.json" },
    ],
  },
  {
    id: "dashboardLetterGrade",
    title: "Letter grade",
    formula: `A ≥ ${SCORING_CONSTANTS.dashboard.gradeA} · B ≥ ${SCORING_CONSTANTS.dashboard.gradeB} · C ≥ ${SCORING_CONSTANTS.dashboard.gradeC}`,
    description: "Letter grade derived from average or best score.",
    industryStandard: "Academic-style bands mapped to interview performance",
    ratingBands: `A ≥ ${SCORING_CONSTANTS.dashboard.gradeA} · B ≥ ${SCORING_CONSTANTS.dashboard.gradeB} · C ≥ ${SCORING_CONSTANTS.dashboard.gradeC}`,
    references: [],
  },
  {
    id: "behaviorBlinkRate",
    title: "Blink rate",
    formula: "blinks / duration_sec × 60",
    description: "Blinks per minute from eye aspect ratio threshold.",
    industryStandard: `${SCORING_CONSTANTS.behavior.blinkRateNormalMin}–${SCORING_CONSTANTS.behavior.blinkRateNormalMax} bpm normal resting blink rate`,
    ratingBands: `Normal ${SCORING_CONSTANTS.behavior.blinkRateNormalMin}–${SCORING_CONSTANTS.behavior.blinkRateNormalMax} bpm`,
    references: [
      { label: "NIH PubMed — blink rate research", url: "https://pubmed.ncbi.nlm.nih.gov/" },
    ],
  },
  {
    id: "behaviorEyeContact",
    title: "Eye contact",
    formula: "mean(head_yaw < 0.08) across frames",
    description: "Fraction of frames where the candidate faces the camera.",
    industryStandard: "≥ 65% sustained eye contact is a common interview coaching target",
    ratingBands: "Strong ≥ 65% · Moderate ≥ 40%",
    references: [
      { label: "Interview presence coaching norms", url: "https://www.shrm.org/topics-tools/news/talent-acquisition" },
    ],
  },
  {
    id: "behaviorConfidence",
    title: "Confidence score",
    formula: "weighted blend of positive emotion, eye contact, head stability, pitch, blink − pause penalty",
    description: "0–100 confidence derived from vision pipeline per answer or interview.",
    industryStandard: "≥ 70 reads as confident presence in coaching rubrics",
    ratingBands: `High ≥ ${SCORING_CONSTANTS.behavior.confidenceCoachingHigh} · Moderate ≥ ${SCORING_CONSTANTS.behavior.confidenceCoachingMid}`,
    references: [
      { label: "App behavior weights", url: "https://github.com/mock-interview-pro/shared/scoring/constants.json" },
    ],
  },
  {
    id: "masteryThreshold",
    title: "Question mastery",
    formula: "mastered = best_overall_score ≥ masteryThreshold",
    description: "Cross-interview memory skips mastered questions.",
    industryStandard: `${SCORING_CONSTANTS.thresholds.mastery}/100 mastery gate (app standard)`,
    ratingBands: `Mastered ≥ ${SCORING_CONSTANTS.thresholds.mastery}`,
    references: [
      { label: "App scoring constants", url: "https://github.com/mock-interview-pro/shared/scoring/constants.json" },
    ],
  },
  {
    id: "renderMs",
    title: "Panel render",
    formula: [
      "renderMs = round(performance.now() − renderStart)",
      "renderStart = performance.now() at the start of each metrics refresh cycle",
    ].join("\n"),
    description: "Client-side time to run one monitor refresh (fetch probes + React state update). Not included in System Performance Score.",
    industryStandard: "Informational only — not scored against industry bands",
    ratingBands: "Not rated",
    references: [
      { label: "MDN — performance.now()", url: "https://developer.mozilla.org/en-US/docs/Web/API/Performance/now" },
    ],
  },
];

export function getFormulaDoc(id: string): FormulaDoc | undefined {
  return FORMULA_DOCS.find((doc) => doc.id === id);
}

export function getMetricsPageFormulas(): FormulaDoc[] {
  return METRICS_PAGE_FORMULA_IDS.map((id) => getFormulaDoc(id)).filter(
    (doc): doc is FormulaDoc => doc != null,
  );
}

export function getBenchmarkForDoc(id: string): FormulaBenchmark | undefined {
  return getFormulaDoc(id)?.benchmarks;
}
