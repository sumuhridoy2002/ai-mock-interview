"use client";

import { useState, type ComponentType } from "react";
import {
  Activity,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  Database,
  ExternalLink,
  Globe,
  GitCompare,
  Monitor,
  RefreshCw,
  Server,
  TrendingDown,
  TrendingUp,
  Workflow,
  X,
} from "lucide-react";
import { useSystemMetrics, type MetricComparison } from "@/hooks/useSystemMetrics";
import { FeatureComparisonTable } from "@/components/system/feature-comparison-table";
import { SystemMethodologyDiagram } from "@/components/system/system-methodology-diagram";
import {
  ratingBadgeClass,
  ratingClass,
  ratingLabel,
  type MetricDelta,
} from "@/lib/performance-benchmarks";
import { PERFORMANCE_METRIC_DOCS } from "@/lib/performance-metric-docs";
import { SYSTEM_COMPONENTS } from "@/lib/system-architecture";
import { cn, formatBytes } from "@/lib/utils";

type MonitorTab = "metrics" | "components" | "compare" | "methodology";

function TechnologyBadge({ technology, category }: { technology: string; category: string }) {
  return (
    <div className="text-right shrink-0">
      <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
        {technology}
      </span>
      <p className="text-[9px] text-slate-600 mt-0.5">{category}</p>
    </div>
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

function ComponentRow({ component }: { component: (typeof SYSTEM_COMPONENTS)[number] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-slate-700/40 bg-slate-900/50 px-3 py-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-2 text-left"
      >
        <p className="text-xs font-semibold text-slate-200">{component.name}</p>
        <TechnologyBadge technology={component.technology} category={component.category} />
      </button>
      {open && (
        <div className="mt-2 pt-2 border-t border-slate-800 space-y-1 text-[10px] text-slate-500">
          <p><span className="text-slate-400">Role:</span> {component.role}</p>
          <p><span className="text-slate-400">Stack:</span> {component.stack}</p>
          <p className="font-mono truncate"><span className="text-slate-400">Endpoint:</span> {component.endpoint}</p>
        </div>
      )}
    </div>
  );
}

const TABS: { id: MonitorTab; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: "metrics", label: "Metrics", icon: Activity },
  { id: "components", label: "Stack", icon: Server },
  { id: "compare", label: "Compare", icon: GitCompare },
  { id: "methodology", label: "How it works", icon: Workflow },
];

export function SystemStatusFooter() {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<MonitorTab>("metrics");
  const [showMetricDocs, setShowMetricDocs] = useState(false);
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
            className="pointer-events-auto w-[min(calc(100vw-2rem),32rem)] max-h-[min(80vh,680px)] overflow-y-auto rounded-xl border border-slate-700/60 bg-slate-950/98 backdrop-blur-md shadow-2xl"
            role="dialog"
            aria-label="System monitor details"
          >
            <div className="sticky top-0 z-10 border-b border-slate-800/80 bg-slate-950/95">
              <div className="flex items-center justify-between px-4 py-2.5">
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
              <div className="flex gap-1 px-3 pb-2 overflow-x-auto">
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    className={cn(
                      "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-medium whitespace-nowrap transition-colors",
                      tab === id
                        ? "bg-indigo-600/25 text-indigo-300"
                        : "text-slate-500 hover:bg-slate-800 hover:text-slate-300",
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-4 py-4 space-y-4">
              {tab === "metrics" && (
                <>
                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Performance vs targets
                    </h3>
                    <div className="space-y-2">
                      <ComparisonRow
                        label="System Performance Score"
                        value={`${metrics.performanceScore}%`}
                        comparison={comparisons.systemPerformanceScore}
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
                        Session avg over {comparisons.session.sampleCount} checks · score{" "}
                        {comparisons.session.performanceScore}% · API{" "}
                        {comparisons.session.apiLatencyMs !== null ? `${comparisons.session.apiLatencyMs} ms` : "—"}
                      </p>
                    )}
                  </section>

                  <section>
                    <button
                      type="button"
                      onClick={() => setShowMetricDocs((v) => !v)}
                      className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-300 mb-2"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      How this is calculated
                      {showMetricDocs ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                    {showMetricDocs && (
                      <div className="space-y-2">
                        {PERFORMANCE_METRIC_DOCS.map((doc) => (
                          <div key={doc.id} className="rounded-lg border border-slate-700/40 bg-slate-900/40 px-3 py-2.5 text-[10px]">
                            <p className="font-semibold text-slate-200">{doc.title}</p>
                            <p className="font-mono text-indigo-300/90 mt-1">{doc.formula}</p>
                            <p className="text-slate-500 mt-1 leading-relaxed">{doc.description}</p>
                            <p className="text-slate-600 mt-1">{doc.ratingBands}</p>
                            {doc.referenceUrl && (
                              <a
                                href={doc.referenceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-indigo-400 hover:underline mt-1.5"
                              >
                                {doc.referenceLabel ?? "Reference"}
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
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
                      <p className="text-[10px] text-slate-500 mb-1">System Performance Score</p>
                      <ScoreBar score={metrics.performanceScore} />
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
                        <div className="rounded bg-slate-800/50 py-1.5">
                          <p className="text-slate-500">Next.js 16</p>
                          <p className="text-emerald-400 font-medium mt-0.5">Active</p>
                        </div>
                        <div className="rounded bg-slate-800/50 py-1.5">
                          <p className="text-slate-500">Laravel 13</p>
                          <p className={cn("font-medium mt-0.5", metrics.apiStatus === "online" ? "text-emerald-400" : "text-rose-400")}>
                            {metrics.apiStatus === "online" ? "Online" : "Unreachable"}
                          </p>
                        </div>
                        <div className="rounded bg-slate-800/50 py-1.5">
                          <p className="text-slate-500">Whisper / Ollama</p>
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
                </>
              )}

              {tab === "components" && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                    Technology stack (tap to expand)
                  </h3>
                  <div className="space-y-2 max-h-[420px] overflow-y-auto">
                    {SYSTEM_COMPONENTS.map((component) => (
                      <ComponentRow key={component.id} component={component} />
                    ))}
                  </div>
                </section>
              )}

              {tab === "compare" && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                    Feature comparison vs other platforms
                  </h3>
                  <p className="text-[10px] text-slate-600 mb-3">
                    How Mock Interview Pro compares to popular mock-interview and hiring tools.
                  </p>
                  <FeatureComparisonTable />
                </section>
              )}

              {tab === "methodology" && (
                <section>
                  <SystemMethodologyDiagram />
                </section>
              )}

              <p className="text-[10px] text-slate-600 text-center">
                Updated {metrics.lastUpdated} · auto {refreshIntervalSeconds}s
              </p>
            </div>
          </div>
        )}

        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-slate-700/60 bg-slate-950/95 backdrop-blur-md shadow-lg pl-2.5 pr-1 py-1">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-slate-800/80 transition-colors"
            title="System Performance Score — open monitor"
          >
            <Activity className="h-3.5 w-3.5 text-indigo-400" />
            <span className={cn("text-xs font-bold font-mono", scoreColor)}>
              {metrics.performanceScore}%
            </span>
            <span className="hidden sm:inline text-[10px] text-slate-500">SPS</span>
            <span className={cn("hidden sm:inline text-[10px] font-mono", ratingClass(apiRating))}>
              API {apiLabel}
            </span>
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
