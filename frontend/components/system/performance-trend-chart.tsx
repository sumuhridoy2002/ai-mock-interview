"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PerformanceSample } from "@/lib/performance-history";

interface PerformanceTrendChartProps {
  samples: PerformanceSample[];
  /** Renders a small sparkline (performance score only) instead of the full multi-line chart. */
  compact?: boolean;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

interface TooltipPayloadEntry {
  dataKey: string;
  name: string;
  value: number;
  color: string;
  unit?: string;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md text-xs space-y-1">
      <p className="font-medium text-muted-foreground">{label != null ? formatTime(label) : ""}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-1.5" style={{ color: p.color }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-mono font-semibold">{p.value}{p.unit ?? ""}</span>
        </p>
      ))}
    </div>
  );
}

export function PerformanceTrendChart({ samples, compact = false }: PerformanceTrendChartProps) {
  const data = useMemo(
    () =>
      samples.map((s) => ({
        ts: s.ts,
        performanceScore: s.performanceScore,
        pageLoadMs: s.pageLoadMs,
        apiLatencyMs: s.apiLatencyMs,
      })),
    [samples],
  );

  if (data.length < 2) {
    return (
      <div className={compact ? "h-16 flex items-center justify-center" : "h-64 flex items-center justify-center"}>
        <p className="text-xs text-muted-foreground text-center px-4">
          Collecting samples — check back after a couple of refreshes.
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <ResponsiveContainer width="100%" height={64}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id="sparklineFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="performanceScore"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#sparklineFill)"
            isAnimationActive={false}
          />
          <Tooltip content={<ChartTooltip />} />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
        <CartesianGrid stroke="var(--border)" strokeOpacity={0.4} vertical={false} />
        <XAxis
          dataKey="ts"
          tickFormatter={formatTime}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
        />
        <YAxis
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />
        <Line type="monotone" dataKey="performanceScore" name="Score" unit="%" stroke="#10b981" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="apiLatencyMs" name="API latency" unit="ms" stroke="#6366f1" strokeWidth={2} dot={false} connectNulls />
        <Line type="monotone" dataKey="pageLoadMs" name="Page load" unit="ms" stroke="#f59e0b" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
