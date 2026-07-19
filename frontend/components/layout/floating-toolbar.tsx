"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Download, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSystemMetrics, SYSTEM_FOOTER_REFRESH_SECONDS } from "@/hooks/useSystemMetrics";
import { getStoredUser, getToken, isAdmin } from "@/lib/auth";
import { exportPageToPng, pageExportFilename } from "@/lib/export-page-png";
import { ratingClass } from "@/lib/performance-benchmarks";
import { cn } from "@/lib/utils";

const PILL =
  "pointer-events-auto flex items-center gap-1 rounded-full border border-slate-700/60 bg-slate-950/95 backdrop-blur-md shadow-lg pl-2.5 pr-1 py-1";

function isDownloadExcludedPath(pathname: string): boolean {
  if (pathname === "/" || pathname === "/login" || pathname === "/register") {
    return true;
  }
  return (
    pathname.startsWith("/interview/live/") ||
    pathname.startsWith("/share/") ||
    pathname.startsWith("/public/")
  );
}

function shouldShowDownload(pathname: string): boolean {
  return !isDownloadExcludedPath(pathname) && Boolean(getToken());
}

function shouldShowAdminMetrics(pathname: string): boolean {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return true;
  }
  if (pathname.startsWith("/system/") && !pathname.startsWith("/system/expert")) {
    return true;
  }
  return false;
}

function SystemMetricsPill() {
  const { metrics, refresh, isRefreshing, refreshIntervalSeconds } = useSystemMetrics({
    refreshIntervalSeconds: SYSTEM_FOOTER_REFRESH_SECONDS,
  });

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
    <div className={PILL}>
      <Link
        href="/system/metrics"
        className="flex items-center gap-2 rounded-full px-2 py-1 transition-colors hover:bg-slate-800/80"
        title="System Performance Score — view metrics"
      >
        <Activity className="h-3.5 w-3.5 text-indigo-400" />
        <span className={cn("text-xs font-bold font-mono", scoreColor)}>
          {metrics.performanceScore}%
        </span>
        <span className="hidden text-xs text-slate-500 sm:inline">SPS</span>
      </Link>
      <span className="text-slate-700">|</span>
      <span className={cn("px-2 text-xs font-mono", ratingClass(apiRating))} title="API latency">
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
  );
}

function PageDownloadPill() {
  const pathname = usePathname();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = useCallback(async () => {
    if (downloading) return;

    const root = document.querySelector<HTMLElement>("[data-page-export-root]");
    if (!root) {
      setError("Page not ready.");
      return;
    }

    setDownloading(true);
    setError(null);

    try {
      await exportPageToPng(root, pageExportFilename(pathname));
    } catch {
      setError("Export failed.");
    } finally {
      setDownloading(false);
    }
  }, [downloading, pathname]);

  return (
    <>
      {error && (
        <p
          className="pointer-events-auto rounded-full border border-rose-500/30 bg-slate-950/95 px-3 py-1.5 text-xs text-rose-400 shadow-lg backdrop-blur-md"
          role="alert"
        >
          {error}
        </p>
      )}
      <div className={PILL} data-page-export-ignore>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 rounded-full px-2 py-1 transition-colors hover:bg-slate-800/80 disabled:opacity-60"
          title="Download this page as a high-resolution PNG"
          aria-label="Download page as PNG"
        >
          <Download className={cn("h-3.5 w-3.5 text-indigo-400", downloading && "animate-pulse")} />
          <span className="text-xs font-bold text-slate-200">
            {downloading ? "Saving…" : "Download"}
          </span>
          <span className="hidden text-xs text-slate-500 sm:inline">PNG</span>
        </button>
      </div>
    </>
  );
}

export function FloatingToolbar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const user = getStoredUser();
  const showDownload = shouldShowDownload(pathname);
  const showMetrics = isAdmin(user) && shouldShowAdminMetrics(pathname);

  if (!showDownload && !showMetrics) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2"
      data-page-export-ignore
    >
      {showMetrics && <SystemMetricsPill />}
      {showDownload && <PageDownloadPill />}
    </div>
  );
}

/** @deprecated Use FloatingToolbar */
export function SystemStatusFooter() {
  return <FloatingToolbar />;
}
