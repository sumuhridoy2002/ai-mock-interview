"use client";

import Link from "next/link";
import { Activity, ChevronRight, Database, Globe, Server, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SystemPerformanceGauge } from "@/components/system/system-performance-gauge";
import { PerformanceTrendChart } from "@/components/system/performance-trend-chart";
import type { SystemMetrics } from "@/hooks/useSystemMetrics";
import {
  ratingBadgeClass,
  ratingClass,
  ratingLabel,
  type MetricDelta,
} from "@/lib/performance-benchmarks";
import { cn, formatBytes } from "@/lib/utils";

function MiniDelta({ delta, unit }: { delta: MetricDelta | null; unit: string }) {
  if (!delta || delta.direction === "same") {
    return <span className="text-muted-foreground">No change</span>;
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-mono text-xs font-medium",
        delta.improved === true && "text-emerald-600 dark:text-emerald-400",
        delta.improved === false && "text-rose-600 dark:text-rose-400",
      )}
    >
      {delta.direction === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {delta.formatted}
      {unit}
    </span>
  );
}

interface MetricPillProps {
  icon: typeof Globe;
  label: string;
  value: string;
  rating: "good" | "ok" | "slow";
  delta: MetricDelta | null;
  unit: string;
}

function MetricPill({ icon: Icon, label, value, rating, delta, unit }: MetricPillProps) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase",
            ratingBadgeClass(rating),
          )}
        >
          {ratingLabel(rating)}
        </span>
      </div>
      <p className={cn("text-xl font-bold font-mono tracking-tight", ratingClass(rating))}>{value}</p>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">vs last refresh</span>
        <MiniDelta delta={delta} unit={unit} />
      </div>
    </div>
  );
}

interface SystemHealthPanelProps {
  metrics: SystemMetrics;
  /** dashboard = compact card; full = metrics page layout */
  variant?: "dashboard" | "full";
}

export function SystemHealthPanel({ metrics, variant = "dashboard" }: SystemHealthPanelProps) {
  const { comparisons, contextData, performanceHistory } = metrics;
  const contextLabel = formatBytes(contextData.appDataBytes);

  const gauge = (
    <SystemPerformanceGauge
      score={metrics.performanceScore}
      rating={comparisons.systemPerformanceScore.rating}
      targetLabel={comparisons.systemPerformanceScore.target}
      size={variant === "full" ? "lg" : "sm"}
    />
  );

  const pills = (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <MetricPill
        icon={Globe}
        label="Page load"
        value={`${metrics.pageLoadMs} ms`}
        rating={comparisons.pageLoad.rating}
        delta={comparisons.pageLoad.vsPrevious}
        unit=" ms"
      />
      <MetricPill
        icon={Server}
        label="API latency"
        value={metrics.apiLatencyMs != null ? `${metrics.apiLatencyMs} ms` : "—"}
        rating={comparisons.apiLatency.rating}
        delta={comparisons.apiLatency.vsPrevious}
        unit=" ms"
      />
      <MetricPill
        icon={Database}
        label="App data size"
        value={contextLabel}
        rating={comparisons.context.rating}
        delta={comparisons.context.vsPrevious}
        unit=""
      />
    </div>
  );

  const latencyChart = (
    <div className="rounded-xl border border-border bg-muted/20 p-4 min-w-0">
      <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
        Response times over time
      </p>
      <PerformanceTrendChart samples={performanceHistory} />
    </div>
  );

  if (variant === "full") {
    return (
      <section className="rounded-2xl border border-border bg-card p-5 shadow-md space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">System Performance Score</h2>
              <p className="text-sm text-muted-foreground">
                Composite health score and response-time trends (last {performanceHistory.length} samples)
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(200px,240px)_1fr]">
          <div className="flex justify-center lg:justify-start rounded-xl border border-border bg-gradient-to-br from-muted/40 to-card p-5">
            {gauge}
          </div>
          {latencyChart}
        </div>
      </section>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-indigo-500" />
          System Health
        </CardTitle>
        <Link href="/system/metrics" className="text-xs text-primary hover:underline flex items-center gap-1">
          Full report <ChevronRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="shrink-0 rounded-xl border border-border bg-gradient-to-br from-indigo-500/5 to-violet-500/5 px-6 py-4">
            {gauge}
          </div>
          <div className="flex-1 w-full">{pills}</div>
        </div>
      </CardContent>
    </Card>
  );
}
