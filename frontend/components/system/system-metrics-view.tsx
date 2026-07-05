"use client";

import { type ComponentType } from "react";
import {
  Activity,
  Clock,
  Database,
  Globe,
  HardDrive,
  RefreshCw,
  Server,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useSystemMetrics, type MetricComparison } from "@/hooks/useSystemMetrics";
import { PageHeader } from "@/components/layout/page-header";
import { FormulaReference } from "@/components/scoring/formula-reference";
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
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-sm font-mono font-semibold text-foreground w-10 text-right">{score}%</span>
    </div>
  );
}

function DeltaText({ delta, unit }: { delta: MetricDelta | null; unit: string }) {
  if (!delta || delta.direction === "same") {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-mono text-xs",
        delta.improved === true && "text-emerald-600 dark:text-emerald-400",
        delta.improved === false && "text-rose-600 dark:text-rose-400",
        delta.improved === null && "text-muted-foreground",
      )}
    >
      {delta.direction === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {delta.formatted}
      {unit}
    </span>
  );
}

function MetricTile({
  label,
  value,
  comparison,
  unit,
  docId,
  numericValue,
  icon: Icon,
  children,
}: {
  label: string;
  value: string;
  comparison: MetricComparison;
  unit: string;
  docId: string;
  numericValue?: number | null;
  icon: ComponentType<{ className?: string }>;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{label}</p>
            <p className="text-[11px] text-muted-foreground truncate">Target: {comparison.target}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", ratingBadgeClass(comparison.rating))}>
            {ratingLabel(comparison.rating)}
          </span>
        </div>
      </div>

      <p className={cn("text-2xl font-bold font-mono tracking-tight", ratingClass(comparison.rating))}>{value}</p>

      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>vs last</span>
        <DeltaText delta={comparison.vsPrevious} unit={unit} />
      </div>

      {children}

      <FormulaReference
        docId={docId}
        currentValue={numericValue ?? undefined}
        currentUnit={unit.trim() || undefined}
      />
    </div>
  );
}

const STACK_STATUS = [
  { name: "Next.js 16", status: "Active", ok: true },
  { name: "Laravel API", key: "api" as const },
  { name: "Vision / AI", status: "Server-side", ok: null },
  { name: "Queue worker", status: "Background", ok: null },
];

export function SystemMetricsView() {
  const { metrics, refresh, isRefreshing, refreshIntervalSeconds } = useSystemMetrics();
  const { contextData, comparisons, apiTiming } = metrics;
  const contextLabel = formatBytes(contextData.appDataBytes);

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          size="md"
          title="Performance & Analytics"
          subtitle="Live scores vs industry standards with calculation formulas shown on each metric."
          className="flex-1 min-w-0"
        />
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin text-primary")} />
          Refresh
        </button>
      </div>

      {/* Primary KPIs — one row, no duplicate formula blocks */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Performance vs standards
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            label="System Performance Score"
            value={`${metrics.performanceScore}%`}
            comparison={comparisons.systemPerformanceScore}
            unit="%"
            docId="systemPerformanceScore"
            numericValue={metrics.performanceScore}
            icon={Activity}
          />
          <MetricTile
            label="Page load"
            value={`${metrics.pageLoadMs} ms`}
            comparison={comparisons.pageLoad}
            unit=" ms"
            docId="pageLoad"
            numericValue={metrics.pageLoadMs}
            icon={Globe}
          />
          <MetricTile
            label="API latency"
            value={metrics.apiLatencyMs !== null ? `${metrics.apiLatencyMs} ms` : "—"}
            comparison={comparisons.apiLatency}
            unit=" ms"
            docId="apiLatency"
            numericValue={metrics.apiLatencyMs}
            icon={Server}
          >
            {(apiTiming.pingMs != null || apiTiming.ttfbMs != null) && (
              <div className="mt-3 pt-3 border-t border-border space-y-1 text-[11px] text-muted-foreground">
                {apiTiming.pingMs != null && (
                  <div className="flex justify-between"><span>Ping</span><span className="font-mono text-foreground">{apiTiming.pingMs} ms</span></div>
                )}
                {apiTiming.ttfbMs != null && (
                  <div className="flex justify-between"><span>TTFB</span><span className="font-mono text-foreground">{apiTiming.ttfbMs} ms</span></div>
                )}
                {apiTiming.transferMs != null && (
                  <div className="flex justify-between"><span>Transfer</span><span className="font-mono text-foreground">{apiTiming.transferMs} ms</span></div>
                )}
                {apiTiming.wasNotModified && (
                  <div className="flex justify-between"><span>Cache</span><span className="font-mono text-emerald-600 dark:text-emerald-400">304</span></div>
                )}
              </div>
            )}
          </MetricTile>
          <MetricTile
            label="App data size"
            value={contextLabel}
            comparison={comparisons.context}
            unit=""
            docId="contextBytes"
            numericValue={contextData.appDataBytes}
            icon={Database}
          />
        </div>
        {comparisons.session && (
          <p className="mt-3 text-xs text-muted-foreground">
            Session average ({comparisons.session.sampleCount} samples): score {comparisons.session.performanceScore}%
            {comparisons.session.apiLatencyMs != null && ` · API ${comparisons.session.apiLatencyMs} ms`}
          </p>
        )}
      </section>

      {/* Timing + overall health — side by side on wide screens */}
      <div className="grid gap-6 lg:grid-cols-2">
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          Timing breakdown
        </h2>
        <div className="grid gap-3 grid-cols-2">
          {[
            { label: "DOM ready", value: `${metrics.domReadyMs} ms`, docId: "domReady" },
            { label: "Panel render", value: `${metrics.renderMs} ms`, docId: "renderMs" },
            { label: "Route", value: metrics.route, docId: null },
            { label: "API status", value: metrics.apiStatus, docId: null },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{item.label}</p>
              <p className="text-sm font-mono font-medium text-foreground mt-0.5 truncate" title={item.value}>
                {item.value}
              </p>
              {item.docId && (
                <FormulaReference docId={item.docId} compact className="mt-2 !p-2" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Overall score + stack */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm h-full">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-foreground">Overall health</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Composite score from load time, API, and reachability</p>
        </div>
        <ScoreBar score={metrics.performanceScore} />
        <FormulaReference
          docId="systemPerformanceScore"
          currentValue={metrics.performanceScore}
          currentUnit="%"
          className="mt-4"
        />
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STACK_STATUS.map((s) => (
            <div key={s.name} className="rounded-lg bg-muted/40 px-3 py-2 text-center">
              <p className="text-[10px] text-muted-foreground">{s.name}</p>
              <p
                className={cn(
                  "text-xs font-medium mt-0.5",
                  s.key === "api"
                    ? metrics.apiStatus === "online"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                    : s.ok === true
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground"
                )}
              >
                {s.key === "api" ? (metrics.apiStatus === "online" ? "Online" : "Offline") : s.status}
              </p>
            </div>
          ))}
        </div>
      </section>
      </div>

      {/* Context storage — collapsed detail */}
      <details className="rounded-xl border border-border bg-card group">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-foreground flex items-center justify-between">
          <span className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            Storage breakdown
          </span>
          <span className="text-xs font-mono text-muted-foreground">{contextLabel} total</span>
        </summary>
        <div className="px-4 pb-4 grid gap-3 sm:grid-cols-3 border-t border-border pt-3">
          <div>
            <p className="text-xs text-muted-foreground">localStorage</p>
            <p className="font-mono text-foreground">{formatBytes(contextData.localStorageBytes)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">sessionStorage</p>
            <p className="font-mono text-foreground">{formatBytes(contextData.sessionStorageBytes)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last API payload</p>
            <p className="font-mono text-foreground">
              {contextData.apiResponseBytes != null ? formatBytes(contextData.apiResponseBytes) : "—"}
            </p>
          </div>
        </div>
      </details>

      <p className="text-xs text-muted-foreground text-center pb-2">
        Updated {metrics.lastUpdated} · auto-refresh every {refreshIntervalSeconds}s
      </p>
    </div>
  );
}
