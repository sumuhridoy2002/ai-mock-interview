const STORAGE_KEY = "mip_perf_history";
export const PERFORMANCE_HISTORY_MAX_SAMPLES = 30;
const MAX_SAMPLES = PERFORMANCE_HISTORY_MAX_SAMPLES;

export interface PerformanceSample {
  ts: number;
  pageLoadMs: number;
  domReadyMs: number;
  apiLatencyMs: number | null;
  performanceScore: number;
  contextBytes: number;
}

export interface SessionAverages {
  sampleCount: number;
  pageLoadMs: number;
  apiLatencyMs: number | null;
  performanceScore: number;
  contextBytes: number;
}

function readSamples(): PerformanceSample[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PerformanceSample[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSamples(samples: PerformanceSample[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(samples.slice(-MAX_SAMPLES)));
  } catch {
    // ignore quota errors
  }
}

export function appendPerformanceSample(sample: Omit<PerformanceSample, "ts">): PerformanceSample[] {
  const samples = readSamples();
  const entry: PerformanceSample = { ...sample, ts: Date.now() };
  const next = [...samples, entry].slice(-MAX_SAMPLES);
  writeSamples(next);
  return next;
}

export function getPerformanceHistory(): PerformanceSample[] {
  return readSamples();
}

export function computeSessionAverages(samples: PerformanceSample[]): SessionAverages | null {
  if (samples.length === 0) return null;

  const apiValues = samples.map((s) => s.apiLatencyMs).filter((v): v is number => v !== null);

  return {
    sampleCount: samples.length,
    pageLoadMs: Math.round(samples.reduce((sum, s) => sum + s.pageLoadMs, 0) / samples.length),
    apiLatencyMs:
      apiValues.length > 0
        ? Math.round(apiValues.reduce((sum, v) => sum + v, 0) / apiValues.length)
        : null,
    performanceScore: Math.round(
      samples.reduce((sum, s) => sum + s.performanceScore, 0) / samples.length,
    ),
    contextBytes: Math.round(
      samples.reduce((sum, s) => sum + s.contextBytes, 0) / samples.length,
    ),
  };
}

export function getPreviousSample(samples: PerformanceSample[]): PerformanceSample | null {
  if (samples.length < 2) return null;
  return samples[samples.length - 2];
}
