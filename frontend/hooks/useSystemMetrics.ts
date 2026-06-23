"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { API_URL } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { EMPTY_CONTEXT_DATA, measureClientContext, type ContextDataMetrics } from "@/lib/context-metrics";
import {
  computeDelta,
  PERFORMANCE_BENCHMARKS,
  rateMetric,
  type MetricDelta,
  type PerformanceRating,
} from "@/lib/performance-benchmarks";
import {
  appendPerformanceSample,
  computeSessionAverages,
  getPreviousSample,
  type SessionAverages,
} from "@/lib/performance-history";

/** Recommended auto-refresh interval for the sticky system monitor. */
export const SYSTEM_MONITOR_REFRESH_SECONDS = 15;

export interface MetricComparison {
  rating: PerformanceRating;
  target: string;
  vsPrevious: MetricDelta | null;
  vsSessionAvg: MetricDelta | null;
}

export interface PerformanceComparisons {
  pageLoad: MetricComparison;
  apiLatency: MetricComparison;
  healthScore: MetricComparison;
  context: MetricComparison;
  session: SessionAverages | null;
}

export interface SystemMetrics {
  pageLoadMs: number;
  domReadyMs: number;
  renderMs: number;
  apiLatencyMs: number | null;
  apiStatus: "online" | "offline" | "checking";
  performanceScore: number;
  lastUpdated: string;
  route: string;
  contextData: ContextDataMetrics;
  comparisons: PerformanceComparisons;
}

const EMPTY_COMPARISONS: PerformanceComparisons = {
  pageLoad: { rating: "ok", target: PERFORMANCE_BENCHMARKS.pageLoad.targetLabel, vsPrevious: null, vsSessionAvg: null },
  apiLatency: { rating: "ok", target: PERFORMANCE_BENCHMARKS.apiLatency.targetLabel, vsPrevious: null, vsSessionAvg: null },
  healthScore: { rating: "ok", target: PERFORMANCE_BENCHMARKS.healthScore.targetLabel, vsPrevious: null, vsSessionAvg: null },
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

function computePerformanceScore(pageLoadMs: number, apiLatencyMs: number | null, apiOnline: boolean): number {
  let score = 100;

  if (pageLoadMs > 3000) score -= 25;
  else if (pageLoadMs > 1500) score -= 12;
  else if (pageLoadMs > 800) score -= 5;

  if (apiLatencyMs !== null) {
    if (apiLatencyMs > 2000) score -= 20;
    else if (apiLatencyMs > 800) score -= 10;
    else if (apiLatencyMs > 300) score -= 4;
  }

  if (!apiOnline) score -= 30;

  return Math.max(0, Math.min(100, score));
}

function buildComparisons(
  pageLoadMs: number,
  domReadyMs: number,
  apiLatencyMs: number | null,
  performanceScore: number,
  contextBytes: number,
): PerformanceComparisons {
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
    const benchmark = PERFORMANCE_BENCHMARKS[benchmarkKey];
    return {
      rating: current !== null ? rateMetric(current, benchmark) : "ok",
      target: benchmark.targetLabel,
      vsPrevious: computeDelta(current, prev ?? null, higherIsBetter),
      vsSessionAvg: computeDelta(current, avg ?? null, higherIsBetter),
    };
  };

  return {
    pageLoad: build(pageLoadMs, "pageLoad", previous?.pageLoadMs, session?.pageLoadMs),
    apiLatency: build(apiLatencyMs, "apiLatency", previous?.apiLatencyMs, session?.apiLatencyMs),
    healthScore: build(performanceScore, "healthScore", previous?.performanceScore, session?.performanceScore, true),
    context: build(contextBytes, "contextBytes", previous?.contextBytes, session?.contextBytes),
    session,
  };
}

export function useSystemMetrics() {
  const pathname = usePathname();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshInFlight = useRef(false);
  const [metrics, setMetrics] = useState<SystemMetrics>(() => ({
    pageLoadMs: 0,
    domReadyMs: 0,
    renderMs: 0,
    apiLatencyMs: null,
    apiStatus: "checking",
    performanceScore: 0,
    lastUpdated: "",
    route: pathname,
    contextData: EMPTY_CONTEXT_DATA,
    comparisons: EMPTY_COMPARISONS,
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

    const token = getToken();
    if (token) {
      const start = performance.now();
      try {
        const response = await fetch(`${API_URL}/user`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });
        apiLatencyMs = Math.round(performance.now() - start);
        apiStatus = response.ok ? "online" : "offline";

        const raw = await response.clone().text();
        apiResponseBytes = new Blob([raw]).size;
      } catch {
        apiLatencyMs = Math.round(performance.now() - start);
        apiStatus = "offline";
      }
    } else {
      apiStatus = "offline";
    }

    const renderMs = Math.round(performance.now() - renderStart);
    const apiOnline = apiStatus === "online";
    const contextData = measureClientContext(apiResponseBytes);
    const performanceScore = computePerformanceScore(pageLoadMs, apiLatencyMs, apiOnline);

    const comparisons =
      typeof window !== "undefined"
        ? buildComparisons(
            pageLoadMs,
            domReadyMs,
            apiLatencyMs,
            performanceScore,
            contextData.totalClientContextBytes,
          )
        : EMPTY_COMPARISONS;

    setMetrics({
      pageLoadMs,
      domReadyMs,
      renderMs,
      apiLatencyMs,
      apiStatus,
      performanceScore,
      lastUpdated: new Date().toLocaleTimeString(),
      route: pathname,
      contextData,
      comparisons,
    });

    refreshInFlight.current = false;
    setIsRefreshing(false);
  }, [pathname]);

  useEffect(() => {
    void refresh();

    const intervalMs = SYSTEM_MONITOR_REFRESH_SECONDS * 1000;

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
  }, [refresh]);

  return { metrics, refresh, isRefreshing, refreshIntervalSeconds: SYSTEM_MONITOR_REFRESH_SECONDS };
}
