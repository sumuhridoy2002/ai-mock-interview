"use client";

import { useState, type ComponentType } from "react";
import {
  Activity,
  BookOpen,
  ChevronDown,
  Clock,
  Database,
  ExternalLink,
  Globe,
  HardDrive,
  RefreshCw,
  Server,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { PerformanceSamplesDialog } from "@/components/system/performance-samples-dialog";
import { PerformanceTrendChart } from "@/components/system/performance-trend-chart";
import { useSystemMetrics, type MetricComparison } from "@/hooks/useSystemMetrics";
import { getMetricsPageFormulas } from "@/lib/scoring-docs";
import {
  ratingClass,
  ratingLabel,
  type MetricDelta,
  type PerformanceRating,
} from "@/lib/performance-benchmarks";
import { cn, formatBytes } from "@/lib/utils";

function ratingAccent(rating: PerformanceRating): string {
  if (rating === "good") return "border-emerald-500 bg-emerald-500/5";
  if (rating === "ok") return "border-amber-500 bg-amber-500/5";
  return "border-rose-500 bg-rose-500/5";
}

function ratingIconBg(rating: PerformanceRating): string {
  if (rating === "good") return "from-emerald-500 to-emerald-600";
  if (rating === "ok") return "from-amber-500 to-amber-600";
  return "from-rose-500 to-rose-600";
}

function ratingBadgeSolid(rating: PerformanceRating): string {
  if (rating === "good") return "bg-emerald-500 text-white border-emerald-600";
  if (rating === "ok") return "bg-amber-400 text-amber-950 border-amber-500";
  return "bg-rose-500 text-white border-rose-600";
}

function DeltaText({ delta, unit }: { delta: MetricDelta | null; unit: string }) {
  if (!delta || delta.direction === "same") {
    return <span className="text-muted-foreground">No change</span>;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono text-sm font-medium",
        delta.improved === true && "text-emerald-600 dark:text-emerald-400",
        delta.improved === false && "text-rose-600 dark:text-rose-400",
        delta.improved === null && "text-muted-foreground",
      )}
    >
      {delta.direction === "up" ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
      {delta.formatted}
      {unit}
    </span>
  );
}

function MetricCard({
  label,
  value,
  comparison,
  unit,
  icon: Icon,
  children,
}: {
  label: string;
  value: string;
  comparison: MetricComparison;
  unit: string;
  icon: ComponentType<{ className?: string }>;
  children?: React.ReactNode;
}) {
  const rating = comparison.rating;

  return (
    <div
      className={cn(
        "rounded-2xl border-l-4 border border-border bg-card p-5 shadow-md hover:shadow-lg transition-shadow",
        ratingAccent(rating),
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md",
            ratingIconBg(rating),
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <span
          className={cn(
            "rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide shadow-sm",
            ratingBadgeSolid(rating),
          )}
        >
          {ratingLabel(rating)}
        </span>
      </div>

      <p className="mt-4 text-sm font-medium text-muted-foreground">{label}</p>
      <p className={cn("text-3xl font-bold font-mono tracking-tight mt-0.5", ratingClass(rating))}>{value}</p>

      <p className="mt-2 text-sm text-muted-foreground leading-snug line-clamp-2" title={comparison.target}>
        {comparison.target}
      </p>

      <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
        <span className="text-muted-foreground">vs last refresh</span>
        <DeltaText delta={comparison.vsPrevious} unit={unit} />
      </div>

      {children}
    </div>
  );
}

function TimingStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        highlight
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-card",
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 font-mono font-bold truncate",
          highlight ? "text-primary text-lg" : "text-foreground text-base",
        )}
        title={value}
      >
        {value}
      </p>
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
  const [formulasOpen, setFormulasOpen] = useState(false);
  const [samplesOpen, setSamplesOpen] = useState(false);

  const scoreRating = comparisons.systemPerformanceScore.rating;
  const scoreRingColor =
    scoreRating === "good" ? "#10b981" : scoreRating === "ok" ? "#f59e0b" : "#f43f5e";

  return (
    <div className="w-full space-y-6">
      {/* Hero */}
      <section className="rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-800 p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/20 overflow-hidden relative">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="absolute -left-4 bottom-0 h-32 w-32 rounded-full bg-violet-400/20 blur-2xl" aria-hidden />

        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5 min-w-0">
            <div
              className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(${scoreRingColor} ${metrics.performanceScore}%, rgba(255,255,255,0.2) 0)`,
              }}
            >
              <div className="flex h-[4.5rem] w-[4.5rem] flex-col items-center justify-center rounded-full bg-indigo-900/60 backdrop-blur-sm">
                <span className="text-2xl font-bold font-mono leading-none">{metrics.performanceScore}</span>
                <span className="text-xs font-medium opacity-80">/ 100</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-300" />
                <h1 className="text-xl sm:text-2xl font-bold">Performance &amp; Analytics</h1>
              </div>
              <p className="mt-1 text-sm text-indigo-100 max-w-md">
                Live system health — page load, API latency, and client data vs industry standards.
              </p>
              <span
                className={cn(
                  "inline-block mt-3 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
                  ratingBadgeSolid(scoreRating),
                )}
              >
                {ratingLabel(scoreRating)}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={() => void refresh()}
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 hover:bg-white/25 transition-colors backdrop-blur-sm"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              Refresh
            </button>
            <p className="text-xs text-indigo-200">
              Updated {metrics.lastUpdated} · every {refreshIntervalSeconds}s
            </p>
          </div>
        </div>

        {comparisons.session && (
          <button
            type="button"
            onClick={() => setSamplesOpen(true)}
            className="relative mt-4 text-sm text-indigo-100 rounded-lg bg-white/10 px-3 py-2 inline-flex flex-wrap items-center gap-x-1.5 gap-y-1 ring-1 ring-white/20 hover:bg-white/20 hover:ring-white/40 transition-colors cursor-pointer text-left"
          >
            <span className="font-semibold text-white underline decoration-white/50 underline-offset-2">
              {comparisons.session.sampleCount} samples
            </span>
            <span className="text-indigo-100/90">session avg:</span>
            <span className="font-mono font-bold text-white">{comparisons.session.performanceScore}%</span>
            {comparisons.session.apiLatencyMs != null && (
              <>
                <span className="text-indigo-100/90">· API</span>
                <span className="font-mono font-bold text-white">{comparisons.session.apiLatencyMs} ms</span>
              </>
            )}
            <span className="text-xs text-indigo-200 ml-1">(click to view)</span>
          </button>
        )}
      </section>

      {comparisons.session && (
        <PerformanceSamplesDialog
          open={samplesOpen}
          onClose={() => setSamplesOpen(false)}
          samples={metrics.performanceHistory}
          averages={comparisons.session}
        />
      )}

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="System Performance Score"
          value={`${metrics.performanceScore}%`}
          comparison={comparisons.systemPerformanceScore}
          unit="%"
          icon={Activity}
        />
        <MetricCard
          label="Page load"
          value={`${metrics.pageLoadMs} ms`}
          comparison={comparisons.pageLoad}
          unit=" ms"
          icon={Globe}
        />
        <MetricCard
          label="API latency"
          value={metrics.apiLatencyMs !== null ? `${metrics.apiLatencyMs} ms` : "—"}
          comparison={comparisons.apiLatency}
          unit=" ms"
          icon={Server}
        />
        <MetricCard
          label="App data size"
          value={contextLabel}
          comparison={comparisons.context}
          unit=""
          icon={Database}
        />
      </div>

      {/* Performance over time */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Performance over time</h2>
            <p className="text-sm text-muted-foreground">
              Score, API latency, and page load across your last {metrics.performanceHistory.length} samples
            </p>
          </div>
        </div>
        <PerformanceTrendChart samples={metrics.performanceHistory} />
      </section>

      {/* Detail panels */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* API breakdown */}
        <section className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <Server className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">API probe breakdown</h2>
              <p className="text-sm text-muted-foreground">Ping, TTFB, and transfer from Resource Timing</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <TimingStat label="Round-trip" value={metrics.apiLatencyMs != null ? `${metrics.apiLatencyMs} ms` : "—"} highlight />
            <TimingStat label="Ping" value={apiTiming.pingMs != null ? `${apiTiming.pingMs} ms` : "—"} />
            <TimingStat label="TTFB" value={apiTiming.ttfbMs != null ? `${apiTiming.ttfbMs} ms` : "—"} />
            <TimingStat label="Transfer" value={apiTiming.transferMs != null ? `${apiTiming.transferMs} ms` : "—"} />
          </div>

          {apiTiming.wasNotModified && (
            <p className="mt-3 text-sm font-medium text-emerald-600 dark:text-emerald-400 rounded-lg bg-emerald-500/10 px-3 py-2 border border-emerald-500/20">
              ETag cache hit — 304 Not Modified
            </p>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <TimingStat label="DOM ready" value={`${metrics.domReadyMs} ms`} />
            <TimingStat label="Panel render" value={`${metrics.renderMs} ms`} />
            <TimingStat label="Route" value={metrics.route} />
            <TimingStat
              label="API status"
              value={metrics.apiStatus === "online" ? "Online" : metrics.apiStatus}
              highlight={metrics.apiStatus === "online"}
            />
          </div>
        </section>

        {/* Stack + storage */}
        <section className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-primary" />
              <h2 className="text-base font-bold text-foreground">Stack status</h2>
            </div>
            <div className="space-y-2">
              {STACK_STATUS.map((s) => {
                const isApi = s.key === "api";
                const online = metrics.apiStatus === "online";
                const statusText = isApi ? (online ? "Online" : "Offline") : s.status;
                const ok = isApi ? online : s.ok === true;

                return (
                  <div
                    key={s.name}
                    className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2.5"
                  >
                    <span className="text-sm font-medium text-foreground">{s.name}</span>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-bold",
                        ok
                          ? "bg-emerald-500 text-white"
                          : isApi
                            ? "bg-rose-500 text-white"
                            : "bg-slate-400/30 text-muted-foreground",
                      )}
                    >
                      {statusText}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-2 text-base font-bold text-foreground">
                <HardDrive className="h-4 w-4 text-primary" />
                Storage
              </span>
              <span className="font-mono text-sm font-bold text-primary">{contextLabel}</span>
            </div>
            <div className="space-y-2 text-sm">
              {[
                { label: "localStorage", value: formatBytes(contextData.localStorageBytes) },
                { label: "sessionStorage", value: formatBytes(contextData.sessionStorageBytes) },
                {
                  label: "Last API payload",
                  value: contextData.apiResponseBytes != null ? formatBytes(contextData.apiResponseBytes) : "—",
                },
              ].map((row) => (
                <div key={row.label} className="flex justify-between rounded-lg bg-muted/40 px-3 py-2">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-mono font-medium text-foreground">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Formulas — collapsed by default */}
      <section className="rounded-2xl border-2 border-primary/20 bg-card shadow-md overflow-hidden">
        <button
          type="button"
          onClick={() => setFormulasOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
        >
          <span className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-600 text-white shadow-md">
              <BookOpen className="h-5 w-5" />
            </div>
            <span>
              <span className="block text-base font-bold text-foreground">Calculations &amp; references</span>
              <span className="block text-sm text-muted-foreground mt-0.5">
                Exact formulas, industry standards, and source links
              </span>
            </span>
          </span>
          <ChevronDown
            className={cn("h-5 w-5 text-muted-foreground shrink-0 transition-transform", formulasOpen && "rotate-180")}
          />
        </button>

        {formulasOpen && (
          <div className="border-t border-border p-5 grid gap-4 lg:grid-cols-2">
            {getMetricsPageFormulas().map((doc) => (
              <div
                key={doc.id}
                className="rounded-xl border border-border bg-gradient-to-br from-muted/30 to-card p-4 shadow-sm"
              >
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  {doc.title}
                </h3>
                <pre className="mt-3 font-mono text-sm text-primary leading-relaxed whitespace-pre-wrap break-words rounded-lg bg-indigo-500/5 dark:bg-indigo-500/10 border border-primary/15 p-3">
                  {doc.formula}
                </pre>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{doc.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                    {doc.industryStandard}
                  </span>
                  <span className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-800 dark:text-amber-300">
                    {doc.ratingBands}
                  </span>
                </div>
                {doc.references.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {doc.references.map((ref) => (
                      <li key={ref.url}>
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                        >
                          {ref.label}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
