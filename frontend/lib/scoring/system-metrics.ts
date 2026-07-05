import SCORING_CONSTANTS from "./constants";

export function computePerformanceScore(
  pageLoadMs: number,
  apiLatencyMs: number | null,
  apiOnline: boolean,
): number {
  const cfg = SCORING_CONSTANTS.systemMetrics;
  let score = cfg.performanceScore.start;

  const pagePenalties = cfg.pageLoad.penalties as number[];
  if (pageLoadMs > pagePenalties[0]) score -= 25;
  else if (pageLoadMs > pagePenalties[1]) score -= 12;
  else if (pageLoadMs > pagePenalties[2]) score -= 5;

  if (apiLatencyMs !== null) {
    const apiPenalties = cfg.apiLatency.penalties as number[];
    if (apiLatencyMs > apiPenalties[0]) score -= 20;
    else if (apiLatencyMs > apiPenalties[1]) score -= 10;
    else if (apiLatencyMs > apiPenalties[2]) score -= 4;
  }

  if (!apiOnline) score -= cfg.performanceScore.offlinePenalty;

  return Math.max(0, Math.min(100, score));
}
