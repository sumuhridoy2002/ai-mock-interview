"use client";

import Link from "next/link";
import { Activity, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useSystemMetrics } from "@/hooks/useSystemMetrics";
import { fetchUser, getStoredUser, isAdmin } from "@/lib/auth";
import { ratingClass } from "@/lib/performance-benchmarks";
import { cn } from "@/lib/utils";

export function SystemStatusFooter() {
  const [show, setShow] = useState(false);
  const { metrics, refresh, isRefreshing, refreshIntervalSeconds } = useSystemMetrics();

  useEffect(() => {
    const stored = getStoredUser();
    if (isAdmin(stored)) {
      setShow(true);
      return;
    }

    fetchUser()
      .then((user) => setShow(isAdmin(user)))
      .catch(() => setShow(false));
  }, []);

  if (!show) {
    return null;
  }

  const apiLabel =
    metrics.apiStatus === "checking"
      ? "…"
      : metrics.apiStatus === "online"
        ? `${metrics.apiLatencyMs ?? "—"}ms`
        : "off";

  const scoreColor =
    metrics.performanceScore >= 85
      ? "text-emerald-400"
      : metrics.performanceScore >= 65
        ? "text-amber-400"
        : "text-rose-400";

  const apiRating = metrics.comparisons.apiLatency.rating;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-slate-700/60 bg-slate-950/95 backdrop-blur-md shadow-lg pl-2.5 pr-1 py-1">
        <Link
          href="/system/metrics"
          className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-slate-800/80 transition-colors"
          title="System Performance Score — view metrics"
        >
          <Activity className="h-3.5 w-3.5 text-indigo-400" />
          <span className={cn("text-xs font-bold font-mono", scoreColor)}>
            {metrics.performanceScore}%
          </span>
          <span className="hidden sm:inline text-xs text-slate-500">SPS</span>
        </Link>
        <span className="text-slate-700">|</span>
        <span
          className={cn("px-2 text-xs font-mono", ratingClass(apiRating))}
          title="API latency"
        >
          API {apiLabel}
        </span>
        <button
          type="button"
          onClick={() => refresh()}
          disabled={isRefreshing}
          className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 disabled:opacity-50"
          title={`Refresh metrics (auto every ${refreshIntervalSeconds}s)`}
        >
          <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
        </button>
      </div>
    </div>
  );
}
