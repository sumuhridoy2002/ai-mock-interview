import SCORING_CONSTANTS from "./constants";

const T = SCORING_CONSTANTS.thresholds;
const D = SCORING_CONSTANTS.dashboard;

export function computeAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export function letterGrade(score: number): string {
  if (score >= D.gradeA) return "A";
  if (score >= D.gradeB) return "B";
  if (score >= D.gradeC) return "C";
  if (score > 0) return "D";
  return "—";
}

export function isPassed(score: number): boolean {
  return score >= T.pass;
}

export function hiringLabel(rec: string): string {
  return rec.replace(/_/g, " ");
}

export function scoreBandColor(score: number): string {
  if (score >= D.scoreBands.excellent) return "text-emerald-600 dark:text-emerald-400";
  if (score >= D.scoreBands.good) return "text-indigo-600 dark:text-indigo-400";
  if (score >= D.scoreBands.fair) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

export function scoreBarColor(score: number): string {
  if (score >= D.scoreBands.excellent) return "bg-emerald-500";
  if (score >= D.scoreBands.good) return "bg-indigo-500";
  if (score >= D.scoreBands.fair) return "bg-amber-500";
  return "bg-rose-500";
}

export function trendDelta(scores: number[]): number {
  if (scores.length < 2) return 0;
  const half = Math.ceil(scores.length / 2);
  const first = computeAverage(scores.slice(0, half));
  const second = computeAverage(scores.slice(half));
  return second - first;
}
