import SCORING_CONSTANTS from "./constants";

export function toPercent(ratio: number): number {
  return Math.round(ratio * 100);
}

export function clampBar(value: number, max = 100): number {
  return Math.min(max, Math.max(0, value));
}

export function sortEmotions(dist: Record<string, number>): [string, number][] {
  return Object.entries(dist).sort((a, b) => b[1] - a[1]);
}

export function blinkRateNormal(bpm: number): boolean {
  const { blinkRateNormalMin, blinkRateNormalMax } = SCORING_CONSTANTS.behavior;
  return bpm >= blinkRateNormalMin && bpm <= blinkRateNormalMax;
}
