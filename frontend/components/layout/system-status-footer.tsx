"use client";

import { useState, type ComponentType } from "react";
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  Database,
  Globe,
  Monitor,
  RefreshCw,
  Server,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useSystemMetrics, type MetricComparison } from "@/hooks/useSystemMetrics";
import {
  ratingBadgeClass,
  ratingClass,
  ratingLabel,
  type MetricDelta,
} from "@/lib/performance-benchmarks";
import { SYSTEM_COMPONENTS, type ComponentKind } from "@/lib/system-architecture";
import { cn, formatBytes } from "@/lib/utils";

function KindBadge({ kind }: { kind: ComponentKind }) {
  const styles: Record<ComponentKind, string> = {
    client: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    server: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    hybrid: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  };

  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide", styles[kind])}>
      {kind}
    </span>
  );
}

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

  const improved = delta.improved === true;
  const worsened = delta.improved === false;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-mono",
        improved && "text-emerald-400",
        worsened && "text-rose-400",
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
}: {
  label: string;
  value: string;
  comparison: MetricComparison;
  unit: string;
}) {
  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-xs text-slate-400">{label}</span>
        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", ratingBadgeClass(comparison.rating))}>
          {ratingLabel(comparison.rating)}
        </span>
      </div>
      <p className={cn("text-sm font-semibold font-mono", ratingClass(comparison.rating))}>{value}</p>
      <div className="mt-2 grid grid-cols-1 gap-1 text-[10px] text-slate-500">
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
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-900/60 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-500 mb-1">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="text-sm font-semibold text-slate-100 font-mono">{value}</p>
      {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

export function SystemStatusFooter() {
  const [expanded, setExpanded] = useState(false);
  const { metrics, refresh, isRefreshing, refreshIntervalSeconds } = useSystemMetrics();

  const { contextData, comparisons } = metrics;
  const contextLabel = formatBytes(contextData.totalClientContextBytes);

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

  const apiRating = comparisons.apiLatency.rating;

  return (
    <>
      {expanded && (
        <button
          type="button"
          aria-label="Close system monitor"
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
          onClick={() => setExpanded(false)}
        />
      )}

      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 pointer-events-none">
        {expanded && (
          <div
            className="pointer-events-auto w-[min(calc(100vw-2rem),28rem)] max-h-[min(75vh,620px)] overflow-y-auto rounded-xl border border-slate-700/60 bg-slate-950/98 backdrop-blur-md shadow-2xl"
            role="dialog"
            aria-label="System monitor details"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/95 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-400" />
                <span className="text-sm font-semibold text-slate-200">System Monitor</span>
              </div>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-4 py-4 space-y-4">
              {/* Benchmark comparisons */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Performance vs targets
                </h3>
                <div className="space-y-2">
                  <ComparisonRow
                    label="Health score"
                    value={`${metrics.performanceScore}%`}
                    comparison={comparisons.healthScore}
                    unit="%"
                  />
                  <ComparisonRow
                    label="Page load"
                    value={`${metrics.pageLoadMs} ms`}
                    comparison={comparisons.pageLoad}
                    unit=" ms"
                  />
                  <ComparisonRow
                    label="API latency"
                    value={metrics.apiLatencyMs !== null ? `${metrics.apiLatencyMs} ms` : "—"}
                    comparison={comparisons.apiLatency}
                    unit=" ms"
                  />
                  <ComparisonRow
                    label="Context size"
                    value={contextLabel}
                    comparison={comparisons.context}
                    unit=""
                  />
                </div>
                {comparisons.session && (
                  <p className="mt-2 text-[10px] text-slate-600">
                    Session average over {comparisons.session.sampleCount} checks · score{" "}
                    {comparisons.session.performanceScore}% · API{" "}
                    {comparisons.session.apiLatencyMs !== null ? `${comparisons.session.apiLatencyMs} ms` : "—"}
                  </p>
                )}
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Execution time
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <MetricCard label="Page load" value={`${metrics.pageLoadMs} ms`} icon={Globe} />
                  <MetricCard label="DOM ready" value={`${metrics.domReadyMs} ms`} icon={Monitor} />
                  <MetricCard
                    label="API round-trip"
                    value={metrics.apiLatencyMs !== null ? `${metrics.apiLatencyMs} ms` : "—"}
                    sub={metrics.apiStatus}
                    icon={Server}
                  />
                  <MetricCard label="Panel render" value={`${metrics.renderMs} ms`} icon={Cpu} />
                </div>
                <p className="mt-2 text-[10px] text-slate-600 font-mono truncate">Route: {metrics.route}</p>
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5" />
                  Overall performance
                </h3>
                <div className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-3">
                  <ScoreBar score={metrics.performanceScore} />
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div className="rounded bg-slate-800/50 py-1.5">
                      <p className="text-slate-500">Frontend</p>
                      <p className="text-emerald-400 font-medium mt-0.5">Active</p>
                    </div>
                    <div className="rounded bg-slate-800/50 py-1.5">
                      <p className="text-slate-500">Laravel API</p>
                      <p className={cn("font-medium mt-0.5", metrics.apiStatus === "online" ? "text-emerald-400" : "text-rose-400")}>
                        {metrics.apiStatus === "online" ? "Online" : "Unreachable"}
                      </p>
                    </div>
                    <div className="rounded bg-slate-800/50 py-1.5">
                      <p className="text-slate-500">AI / STT</p>
                      <p className="text-slate-400 font-medium mt-0.5">Server-side</p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5" />
                  Context data
                </h3>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="rounded bg-slate-800/50 px-2 py-1.5">
                    <p className="text-slate-500">localStorage</p>
                    <p className="font-mono text-slate-200 mt-0.5">{formatBytes(contextData.localStorageBytes)}</p>
                  </div>
                  <div className="rounded bg-slate-800/50 px-2 py-1.5">
                    <p className="text-slate-500">API payload</p>
                    <p className="font-mono text-slate-200 mt-0.5">
                      {contextData.apiResponseBytes !== null ? formatBytes(contextData.apiResponseBytes) : "—"}
                    </p>
                  </div>
                  <div className="rounded bg-slate-800/50 px-2 py-1.5">
                    <p className="text-slate-500">JS heap</p>
                    <p className="font-mono text-slate-200 mt-0.5">
                      {contextData.jsHeapUsedBytes !== null ? formatBytes(contextData.jsHeapUsedBytes) : "N/A"}
                    </p>
                  </div>
                  <div className="rounded bg-slate-800/50 px-2 py-1.5">
                    <p className="text-slate-500">Storage keys</p>
                    <p className="font-mono text-slate-200 mt-0.5">{contextData.storageItemCount}</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1.5">
                  <Server className="h-3.5 w-3.5" />
                  Components
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {SYSTEM_COMPONENTS.map((component) => (
                    <div key={component.id} className="rounded-lg border border-slate-700/40 bg-slate-900/50 px-3 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-200">{component.name}</p>
                        <KindBadge kind={component.kind} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <p className="text-[10px] text-slate-600 text-center">
                Updated {metrics.lastUpdated} · auto {refreshIntervalSeconds}s
              </p>
            </div>
          </div>
        )}

        {/* Compact floating chip */}
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-slate-700/60 bg-slate-950/95 backdrop-blur-md shadow-lg pl-2.5 pr-1 py-1">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-slate-800/80 transition-colors"
            title="Open system monitor"
          >
            <Activity className="h-3.5 w-3.5 text-indigo-400" />
            <span className={cn("text-xs font-bold font-mono", scoreColor)}>
              {metrics.performanceScore}%
            </span>
            <span className={cn("hidden sm:inline text-[10px] font-mono", ratingClass(apiRating))}>
              API {apiLabel}
            </span>
            {comparisons.apiLatency.vsPrevious && comparisons.apiLatency.vsPrevious.direction !== "same" && (
              <span className="hidden md:inline text-[10px] text-slate-500">
                {comparisons.apiLatency.vsPrevious.formatted}ms
              </span>
            )}
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
            )}
          </button>
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-full p-1.5 hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
            title={`Refresh (auto every ${refreshIntervalSeconds}s)`}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin text-indigo-400")} />
          </button>
        </div>
      </div>
    </>
  );
}
