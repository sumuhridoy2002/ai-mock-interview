"use client";

import { type ComponentType } from "react";
import {
  Activity,
  Clock,
  Cpu,
  Database,
  Globe,
  HardDrive,
  Monitor,
  RefreshCw,
  Server,
  Signal,
  TrendingDown,
  TrendingUp,
  Wifi,
  Zap,
} from "lucide-react";
import { useSystemMetrics, type MetricComparison } from "@/hooks/useSystemMetrics";
import { MetricCalculationInline } from "@/components/system/metric-calculation-inline";
import {
  ratingBadgeClass,
  ratingClass,
  ratingLabel,
  type MetricDelta,
} from "@/lib/performance-benchmarks";
import { cn, formatBytes } from "@/lib/utils";

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 85 ? "bg-emerald-500" : score >= 65 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-slate-700/80 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-mono text-slate-300 w-8 text-right">{score}%</span>
    </div>
  );
}

function DeltaText({ delta, unit }: { delta: MetricDelta | null; unit: string }) {
  if (!delta || delta.direction === "same") {
    return <span className="text-slate-600">—</span>;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-mono",
        delta.improved === true && "text-emerald-400",
        delta.improved === false && "text-rose-400",
        delta.improved === null && "text-slate-500",
      )}
    >
      {delta.direction === "up" ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {delta.formatted}
      {unit}
    </span>
  );
}

function ComparisonRow({
  label,
  value,
  comparison,
  unit,
  docId,
  children,
}: {
  label: string;
  value: string;
  comparison: MetricComparison;
  unit: string;
  docId: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 py-3">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-sm text-slate-300 font-medium">{label}</span>
        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", ratingBadgeClass(comparison.rating))}>
          {ratingLabel(comparison.rating)}
        </span>
      </div>
      <p className={cn("text-lg font-semibold font-mono", ratingClass(comparison.rating))}>{value}</p>
      <div className="mt-2 grid grid-cols-1 gap-1 text-[11px] text-slate-500">
        <p>Target: <span className="text-slate-400">{comparison.target}</span></p>
        <p className="flex items-center justify-between gap-2">
          <span>vs last check</span>
          <DeltaText delta={comparison.vsPrevious} unit={unit} />
        </p>
        <p className="flex items-center justify-between gap-2">
          <span>vs session avg</span>
          <DeltaText delta={comparison.vsSessionAvg} unit={unit} />
        </p>
      </div>
      {children}
      <MetricCalculationInline docId={docId} />
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  docId,
  children,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: ComponentType<{ className?: string }>;
  docId: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 px-4 py-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-500 mb-1">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="text-base font-semibold text-slate-100 font-mono">{value}</p>
      {sub && <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>}
      {children}
      <MetricCalculationInline docId={docId} />
    </div>
  );
}

/* Small sub-row inside a card */
function SubStat({ label, value, dim = false }: { label: string; value: string; dim?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[10px] mt-1">
      <span className="text-slate-600">{label}</span>
      <span className={cn("font-mono", dim ? "text-slate-600" : "text-slate-400")}>{value}</span>
    </div>
  );
}

export function SystemMetricsView() {
  const { metrics, refresh, isRefreshing, refreshIntervalSeconds } = useSystemMetrics();
  const { contextData, comparisons, apiTiming } = metrics;
  const contextLabel = formatBytes(contextData.appDataBytes);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">System Metrics</h1>
          <p className="text-sm text-slate-400 mt-1">
            Live performance scores with targets, trends, and calculation details.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin text-indigo-400")} />
          Refresh
        </button>
      </div>

      {/* Performance vs targets */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3 flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" />
          Performance vs targets
        </h2>
        <div className="grid gap-3 lg:grid-cols-2">
          <ComparisonRow
            label="System Performance Score"
            value={`${metrics.performanceScore}%`}
            comparison={comparisons.systemPerformanceScore}
            unit="%"
            docId="systemPerformanceScore"
          />
          <ComparisonRow
            label="Page load"
            value={`${metrics.pageLoadMs} ms`}
            comparison={comparisons.pageLoad}
            unit=" ms"
            docId="pageLoad"
          />

          {/* API latency with breakdown */}
          <ComparisonRow
            label="API latency"
            value={metrics.apiLatencyMs !== null ? `${metrics.apiLatencyMs} ms` : "—"}
            comparison={comparisons.apiLatency}
            unit=" ms"
            docId="apiLatency"
          >
            <div className="mt-2 pt-2 border-t border-slate-800/60 space-y-0.5">
              <SubStat
                label="Network baseline (ping)"
                value={apiTiming.pingMs !== null ? `${apiTiming.pingMs} ms` : "—"}
              />
              <SubStat
                label="TTFB (server + network)"
                value={apiTiming.ttfbMs !== null ? `${apiTiming.ttfbMs} ms` : "—"}
              />
              <SubStat
                label="Body transfer"
                value={apiTiming.transferMs !== null ? `${apiTiming.transferMs} ms` : "—"}
              />
              {apiTiming.wasNotModified && (
                <SubStat label="ETag" value="304 Not Modified" />
              )}
            </div>
          </ComparisonRow>

          {/* App data size — heap excluded */}
          <ComparisonRow
            label="App data size"
            value={contextLabel}
            comparison={comparisons.context}
            unit=""
            docId="contextBytes"
          />
        </div>
        {comparisons.session && (
          <p className="mt-3 text-xs text-slate-600">
            Session avg over {comparisons.session.sampleCount} checks · score{" "}
            {comparisons.session.performanceScore}% · API{" "}
            {comparisons.session.apiLatencyMs !== null ? `${comparisons.session.apiLatencyMs} ms` : "—"}
          </p>
        )}
      </section>

      {/* Execution time */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          Execution time
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Page load" value={`${metrics.pageLoadMs} ms`} icon={Globe} docId="pageLoad" />
          <MetricCard label="DOM ready" value={`${metrics.domReadyMs} ms`} icon={Monitor} docId="domReady" />
          <MetricCard
            label="API round-trip"
            value={metrics.apiLatencyMs !== null ? `${metrics.apiLatencyMs} ms` : "—"}
            sub={metrics.apiStatus}
            icon={Server}
            docId="apiLatency"
          >
            {(apiTiming.pingMs !== null || apiTiming.ttfbMs !== null) && (
              <div className="mt-1 space-y-0.5">
                {apiTiming.pingMs !== null && (
                  <SubStat label="ping" value={`${apiTiming.pingMs} ms`} />
                )}
                {apiTiming.ttfbMs !== null && (
                  <SubStat label="TTFB" value={`${apiTiming.ttfbMs} ms`} />
                )}
                {apiTiming.transferMs !== null && (
                  <SubStat label="transfer" value={`${apiTiming.transferMs} ms`} />
                )}
              </div>
            )}
          </MetricCard>
          <MetricCard label="Panel render" value={`${metrics.renderMs} ms`} icon={Cpu} docId="renderMs" />
        </div>
        <p className="mt-2 text-xs text-slate-600 font-mono truncate">Route: {metrics.route}</p>
      </section>

      {/* Overall performance */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3 flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5" />
          Overall performance
        </h2>
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4 max-w-xl">
          <p className="text-xs text-slate-500 mb-1">System Performance Score</p>
          <ScoreBar score={metrics.performanceScore} />
          <MetricCalculationInline docId="systemPerformanceScore" />
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px]">
            <div className="rounded-lg bg-slate-800/50 py-2">
              <p className="text-slate-500">Next.js 16</p>
              <p className="text-emerald-400 font-medium mt-0.5">Active</p>
            </div>
            <div className="rounded-lg bg-slate-800/50 py-2">
              <p className="text-slate-500">Laravel 13</p>
              <p className={cn("font-medium mt-0.5", metrics.apiStatus === "online" ? "text-emerald-400" : "text-rose-400")}>
                {metrics.apiStatus === "online" ? "Online" : "Unreachable"}
              </p>
            </div>
            <div className="rounded-lg bg-slate-800/50 py-2">
              <p className="text-slate-500">Whisper / Ollama</p>
              <p className="text-slate-400 font-medium mt-0.5">Server-side</p>
            </div>
          </div>
        </div>
      </section>

      {/* API latency breakdown banner */}
      {(apiTiming.pingMs !== null || apiTiming.ttfbMs !== null) && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3 flex items-center gap-1.5">
            <Signal className="h-3.5 w-3.5" />
            API latency breakdown
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 py-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                <Wifi className="h-3 w-3" /> Network baseline
              </div>
              <p className="text-base font-semibold font-mono text-slate-100">
                {apiTiming.pingMs !== null ? `${apiTiming.pingMs} ms` : "—"}
              </p>
              <p className="text-[10px] text-slate-600 mt-0.5">
                /ping · no auth · no DB
              </p>
            </div>
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 py-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                <Zap className="h-3 w-3" /> TTFB
              </div>
              <p className="text-base font-semibold font-mono text-slate-100">
                {apiTiming.ttfbMs !== null ? `${apiTiming.ttfbMs} ms` : "—"}
              </p>
              <p className="text-[10px] text-slate-600 mt-0.5">
                Time-to-first-byte · server processing + network
              </p>
            </div>
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 py-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                <Server className="h-3 w-3" /> Body transfer
              </div>
              <p className="text-base font-semibold font-mono text-slate-100">
                {apiTiming.transferMs !== null ? `${apiTiming.transferMs} ms` : "—"}
              </p>
              <p className="text-[10px] text-slate-600 mt-0.5">
                Response download duration
              </p>
            </div>
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 py-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                <Activity className="h-3 w-3" /> Cache state
              </div>
              <p className={cn(
                "text-base font-semibold font-mono",
                apiTiming.wasNotModified ? "text-emerald-400" : "text-slate-100",
              )}>
                {apiTiming.wasNotModified ? "304 Hit" : "200 Full"}
              </p>
              <p className="text-[10px] text-slate-600 mt-0.5">
                {apiTiming.wasNotModified
                  ? "ETag matched — body skipped"
                  : "Full response received"}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Context data */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3 flex items-center gap-1.5">
          <Database className="h-3.5 w-3.5" />
          Context data
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 py-3">
            <p className="text-xs text-slate-500">localStorage</p>
            <p className="font-mono text-slate-200 mt-1">{formatBytes(contextData.localStorageBytes)}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">{contextData.storageItemCount} key(s)</p>
            <MetricCalculationInline docId="contextBytes" />
          </div>
          <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 py-3">
            <p className="text-xs text-slate-500">sessionStorage</p>
            <p className="font-mono text-slate-200 mt-1">{formatBytes(contextData.sessionStorageBytes)}</p>
          </div>
          <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 py-3">
            <p className="text-xs text-slate-500">API payload</p>
            <p className="font-mono text-slate-200 mt-1">
              {contextData.apiResponseBytes !== null ? formatBytes(contextData.apiResponseBytes) : "—"}
            </p>
            {contextData.apiResponseBytes === null && (
              <p className="text-[10px] text-slate-600 mt-0.5">304 — body not received</p>
            )}
          </div>
          {/* JS Heap — runtime memory, shown separately, not in context total */}
          <div className="rounded-xl border border-amber-700/20 bg-amber-900/10 px-4 py-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-amber-600/80 mb-1">
              <HardDrive className="h-3 w-3" /> JS Heap (runtime)
            </div>
            <p className="font-mono text-slate-200">
              {contextData.jsHeapUsedBytes !== null ? formatBytes(contextData.jsHeapUsedBytes) : "N/A (non-Chrome)"}
            </p>
            {contextData.jsHeapLimitBytes !== null && (
              <p className="text-[10px] text-slate-600 mt-0.5">
                of {formatBytes(contextData.jsHeapLimitBytes)} limit
              </p>
            )}
            <p className="text-[10px] text-amber-700/80 mt-1.5">
              Next.js runtime memory — excluded from App data size metric
            </p>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-600">
          App data total (excl. JS heap): <span className="text-slate-400 font-mono">{contextLabel}</span>
        </p>
      </section>

      <p className="text-xs text-slate-600 text-center">
        Updated {metrics.lastUpdated} · auto-refresh every {refreshIntervalSeconds}s
      </p>
    </div>
  );
}
