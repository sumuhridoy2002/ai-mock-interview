"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { resolveApiUrl } from "@/lib/api";
import { getToken, USER_ETAG_STORAGE_KEY } from "@/lib/auth";
import { EMPTY_CONTEXT_DATA, measureClientContext, type ContextDataMetrics } from "@/lib/context-metrics";
import {
  BENCHMARK_DOC_IDS,
  computeDelta,
  PERFORMANCE_BENCHMARKS,
  rateMetric,
  type MetricDelta,
  type PerformanceRating,
} from "@/lib/performance-benchmarks";
import { computePerformanceScore } from "@/lib/scoring/system-metrics";
import {
  appendPerformanceSample,
  computeSessionAverages,
  getPreviousSample,
  type PerformanceSample,
  type SessionAverages,
} from "@/lib/performance-history";

/** Recommended auto-refresh interval on the dedicated metrics page. */
export const SYSTEM_MONITOR_REFRESH_SECONDS = 15;

/** Slower polling for the sticky footer monitor (runs on every admin page). */
export const SYSTEM_FOOTER_REFRESH_SECONDS = 60;

export interface ApiTimingBreakdown {
  /** Round-trip to /ping (no auth, no DB) — pure network + PHP bootstrap overhead. */
  pingMs: number | null;
  /** Time-to-first-byte on the /user probe from Resource Timing API. */
  ttfbMs: number | null;
  /** Body transfer duration from Resource Timing API. */
  transferMs: number | null;
  /** Whether the /user response was a 304 Not Modified (ETag hit). */
  wasNotModified: boolean;
}

export interface MetricComparison {
  rating: PerformanceRating;
  target: string;
  vsPrevious: MetricDelta | null;
  vsSessionAvg: MetricDelta | null;
}

export interface PerformanceComparisons {
  pageLoad: MetricComparison;
  apiLatency: MetricComparison;
  systemPerformanceScore: MetricComparison;
  context: MetricComparison;
  session: SessionAverages | null;
}

export interface SystemMetrics {
  pageLoadMs: number;
  domReadyMs: number;
  renderMs: number;
  apiLatencyMs: number | null;
  apiStatus: "online" | "offline" | "checking";
  apiTiming: ApiTimingBreakdown;
  performanceScore: number;
  lastUpdated: string;
  route: string;
  contextData: ContextDataMetrics;
  comparisons: PerformanceComparisons;
  performanceHistory: PerformanceSample[];
}

const EMPTY_API_TIMING: ApiTimingBreakdown = {
  pingMs: null,
  ttfbMs: null,
  transferMs: null,
  wasNotModified: false,
};

const EMPTY_COMPARISONS: PerformanceComparisons = {
  pageLoad: { rating: "ok", target: PERFORMANCE_BENCHMARKS.pageLoad.targetLabel, vsPrevious: null, vsSessionAvg: null },
  apiLatency: { rating: "ok", target: PERFORMANCE_BENCHMARKS.apiLatency.targetLabel, vsPrevious: null, vsSessionAvg: null },
  systemPerformanceScore: { rating: "ok", target: PERFORMANCE_BENCHMARKS.systemPerformanceScore.targetLabel, vsPrevious: null, vsSessionAvg: null },
  context: { rating: "ok", target: PERFORMANCE_BENCHMARKS.contextBytes.targetLabel, vsPrevious: null, vsSessionAvg: null },
  session: null,
};

function measurePageLoad(): Pick<SystemMetrics, "pageLoadMs" | "domReadyMs"> {
  if (typeof window === "undefined" || !window.performance?.timing) {
    return { pageLoadMs: 0, domReadyMs: 0 };
  }

  const { timing } = window.performance;
  const nav = timing.navigationStart || 0;
  const load = timing.loadEventEnd - nav;
  const dom = timing.domContentLoadedEventEnd - nav;

  return {
    pageLoadMs: load > 0 ? load : Math.round(performance.now()),
    domReadyMs: dom > 0 ? dom : Math.round(performance.now()),
  };
}

/** Read the most recent Resource Timing entry for the given URL. */
function readResourceTiming(url: string): { ttfbMs: number | null; transferMs: number | null } {
  if (typeof window === "undefined" || !window.performance?.getEntriesByName) {
    return { ttfbMs: null, transferMs: null };
  }
  const entries = performance.getEntriesByName(url, "resource") as PerformanceResourceTiming[];
  const entry = entries.at(-1);
  if (!entry) return { ttfbMs: null, transferMs: null };

  const ttfb = entry.responseStart - entry.startTime;
  const transfer = entry.responseEnd - entry.responseStart;

  return {
    ttfbMs: ttfb > 0 ? Math.round(ttfb) : null,
    transferMs: transfer > 0 ? Math.round(transfer) : null,
  };
}

function buildComparisons(
  pageLoadMs: number,
  domReadyMs: number,
  apiLatencyMs: number | null,
  performanceScore: number,
  contextBytes: number,
): { comparisons: PerformanceComparisons; samples: PerformanceSample[] } {
  const samples = appendPerformanceSample({
    pageLoadMs,
    domReadyMs,
    apiLatencyMs,
    performanceScore,
    contextBytes,
  });
  const previous = getPreviousSample(samples);
  const session = computeSessionAverages(samples);

  const build = (
    current: number | null,
    benchmarkKey: keyof typeof PERFORMANCE_BENCHMARKS,
    prev: number | null | undefined,
    avg: number | null | undefined,
    higherIsBetter = false,
  ): MetricComparison => {
    const docId = BENCHMARK_DOC_IDS[benchmarkKey] ?? benchmarkKey;
    const benchmark = PERFORMANCE_BENCHMARKS[benchmarkKey];
    return {
      rating: current !== null ? rateMetric(current, docId) : "ok",
      target: benchmark.targetLabel,
      vsPrevious: computeDelta(current, prev ?? null, higherIsBetter),
      vsSessionAvg: computeDelta(current, avg ?? null, higherIsBetter),
    };
  };

  return {
    comparisons: {
    pageLoad: build(pageLoadMs, "pageLoad", previous?.pageLoadMs, session?.pageLoadMs),
    apiLatency: build(apiLatencyMs, "apiLatency", previous?.apiLatencyMs, session?.apiLatencyMs),
    systemPerformanceScore: build(performanceScore, "systemPerformanceScore", previous?.performanceScore, session?.performanceScore, true),
    context: build(contextBytes, "contextBytes", previous?.contextBytes, session?.contextBytes),
    session,
    },
    samples,
  };
}

export function useSystemMetrics(options?: { refreshIntervalSeconds?: number }) {
  const refreshIntervalSeconds = options?.refreshIntervalSeconds ?? SYSTEM_MONITOR_REFRESH_SECONDS;
  const pathname = usePathname();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshInFlight = useRef(false);
  const [metrics, setMetrics] = useState<SystemMetrics>(() => ({
    pageLoadMs: 0,
    domReadyMs: 0,
    renderMs: 0,
    apiLatencyMs: null,
    apiStatus: "checking",
    apiTiming: EMPTY_API_TIMING,
    performanceScore: 0,
    lastUpdated: "",
    route: pathname,
    contextData: EMPTY_CONTEXT_DATA,
    comparisons: EMPTY_COMPARISONS,
    performanceHistory: [],
  }));

  const refresh = useCallback(async () => {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    setIsRefreshing(true);

    const renderStart = performance.now();
    const { pageLoadMs, domReadyMs } = measurePageLoad();

    let apiLatencyMs: number | null = null;
    let apiStatus: SystemMetrics["apiStatus"] = "offline";
    let apiResponseBytes: number | null = null;
    let pingMs: number | null = null;
    let ttfbMs: number | null = null;
    let transferMs: number | null = null;
    let wasNotModified = false;

    const token = getToken();

    // ── 1. Ping probe: pure network + PHP bootstrap, no auth, no DB ────────────
    try {
      const pingStart = performance.now();
      await fetch(`${resolveApiUrl()}/ping`, { cache: "no-store" });
      pingMs = Math.round(performance.now() - pingStart);
    } catch {
      pingMs = null;
    }

    // ── 2. Authenticated /user probe with ETag conditional request ──────────────
    if (token) {
      const userUrl = `${resolveApiUrl()}/user`;
      const start = performance.now();
      try {
        const lastEtag =
          typeof sessionStorage !== "undefined"
            ? (sessionStorage.getItem(USER_ETAG_STORAGE_KEY) ?? undefined)
            : undefined;

        const response = await fetch(userUrl, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            ...(lastEtag ? { "If-None-Match": lastEtag } : {}),
          },
          cache: "no-store",
        });

        apiLatencyMs = Math.round(performance.now() - start);
        wasNotModified = response.status === 304;
        apiStatus = response.ok || wasNotModified ? "online" : "offline";

        // Persist new ETag for next conditional request
        const newEtag = response.headers.get("ETag");
        if (newEtag && typeof sessionStorage !== "undefined") {
          sessionStorage.setItem(USER_ETAG_STORAGE_KEY, newEtag);
        }

        if (!wasNotModified) {
          const raw = await response.clone().text();
          apiResponseBytes = new Blob([raw]).size;
        }
      } catch {
        apiLatencyMs = Math.round(performance.now() - start);
        apiStatus = "offline";
      }

      // ── 3. Resource Timing breakdown (TTFB + transfer) ────────────────────────
      const timing = readResourceTiming(`${resolveApiUrl()}/user`);
      ttfbMs = timing.ttfbMs;
      transferMs = timing.transferMs;
    } else {
      apiStatus = "offline";
    }

    const renderMs = Math.round(performance.now() - renderStart);
    const apiOnline = apiStatus === "online";
    const contextData = measureClientContext(apiResponseBytes);
    const performanceScore = computePerformanceScore(pageLoadMs, apiLatencyMs, apiOnline);

    const historyResult =
      typeof window !== "undefined"
        ? buildComparisons(
            pageLoadMs,
            domReadyMs,
            apiLatencyMs,
            performanceScore,
            contextData.appDataBytes,
          )
        : { comparisons: EMPTY_COMPARISONS, samples: [] as PerformanceSample[] };

    setMetrics({
      pageLoadMs,
      domReadyMs,
      renderMs,
      apiLatencyMs,
      apiStatus,
      apiTiming: { pingMs, ttfbMs, transferMs, wasNotModified },
      performanceScore,
      lastUpdated: new Date().toLocaleTimeString(),
      route: pathname,
      contextData,
      comparisons: historyResult.comparisons,
      performanceHistory: historyResult.samples,
    });

    refreshInFlight.current = false;
    setIsRefreshing(false);
  }, [pathname]);

  useEffect(() => {
    void refresh();

    const intervalMs = refreshIntervalSeconds * 1000;

    const tick = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };

    const id = window.setInterval(tick, intervalMs);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh, refreshIntervalSeconds]);

  return { metrics, refresh, isRefreshing, refreshIntervalSeconds };
}
