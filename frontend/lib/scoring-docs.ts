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

export const FORMULA_DOCS: FormulaDoc[] = [
  {
    id: "apiLatency",
    title: "API round-trip",
    formula: "TTFB + server processing + body transfer (Resource Timing API)",
    description:
      "Authenticated probe to GET /user. Uses Resource Timing to split network overhead, time-to-first-byte, and body transfer.",
    industryStandard: "< 200 ms is the standard good API response time",
    ratingBands: "Good < 200 ms · OK < 800 ms · Slow ≥ 800 ms",
    benchmarks: { goodMax: 200, okMax: 800, unit: "ms" },
    references: [
      { label: "W3C — Resource Timing", url: "https://www.w3.org/TR/resource-timing/" },
      { label: "web.dev — Time to First Byte", url: "https://web.dev/articles/ttfb" },
    ],
  },
  {
    id: "pageLoad",
    title: "Page load",
    formula: "loadEventEnd − navigationStart",
    description: "Full page load using the Navigation Timing API.",
    industryStandard: "< 800 ms good · < 2.5 s LCP target (Core Web Vitals)",
    ratingBands: "Good < 800 ms · OK < 1500 ms · Slow ≥ 1500 ms",
    benchmarks: { goodMax: 800, okMax: 1500, unit: "ms" },
    references: [
      { label: "web.dev — Core Web Vitals", url: "https://web.dev/articles/vitals" },
      { label: "MDN — Navigation Timing", url: "https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Navigation_timing" },
    ],
  },
  {
    id: "domReady",
    title: "DOM ready",
    formula: "domContentLoadedEventEnd − navigationStart",
    description: "Time until HTML is parsed and DOM is ready.",
    industryStandard: "< 600 ms for interactive shell",
    ratingBands: "Good < 600 ms · OK < 1200 ms · Slow ≥ 1200 ms",
    benchmarks: { goodMax: 600, okMax: 1200, unit: "ms" },
    references: [
      { label: "MDN — DOMContentLoaded", url: "https://developer.mozilla.org/en-US/docs/Web/API/Document/DOMContentLoaded_event" },
    ],
  },
  {
    id: "systemPerformanceScore",
    title: "System Performance Score",
    formula: "100 − page-load penalties − API penalties − 30 if API offline",
    description: "Composite health score from page load, API latency, and reachability.",
    industryStandard: "≥ 85% indicates a healthy composite score",
    ratingBands: "Good ≥ 85% · OK ≥ 65% · Slow < 65%",
    benchmarks: { goodMax: 85, okMax: 65, unit: "%", higherIsBetter: true },
    references: [
      { label: "web.dev — Core Web Vitals", url: "https://web.dev/articles/vitals" },
    ],
  },
  {
    id: "contextBytes",
    title: "App data size",
    formula: "localStorage + sessionStorage + last /user API payload",
    description: "Meaningful application-stored data only (auth token, cached user, metrics history).",
    industryStandard: "< 100 KB is standard for client-side app data",
    ratingBands: "Good < 100 KB · OK < 500 KB · Slow ≥ 500 KB",
    benchmarks: { goodMax: 102400, okMax: 512000, unit: "bytes" },
    references: [
      { label: "MDN — Storage API", url: "https://developer.mozilla.org/en-US/docs/Web/API/Storage" },
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
    formula: "performance.now() after refresh − refresh start",
    description: "Time for one monitor refresh cycle.",
    industryStandard: "Informational only — not scored",
    ratingBands: "Not rated",
    references: [],
  },
];

export function getFormulaDoc(id: string): FormulaDoc | undefined {
  return FORMULA_DOCS.find((doc) => doc.id === id);
}

export function getBenchmarkForDoc(id: string): FormulaBenchmark | undefined {
  return getFormulaDoc(id)?.benchmarks;
}
