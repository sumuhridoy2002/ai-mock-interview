"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PerformanceSample } from "@/lib/performance-history";

interface PerformanceTrendChartProps {
  samples: PerformanceSample[];
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function formatMs(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}s`;
  return `${Math.round(value)}ms`;
}

interface TooltipPayloadEntry {
  dataKey: string;
  name: string;
  value: number;
  color: string;
}

function LatencyTooltip({
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
          {p.name}: <span className="font-mono font-semibold">{formatMs(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

/** Time-series chart for API latency and page load only (both in ms). */
export function PerformanceTrendChart({ samples }: PerformanceTrendChartProps) {
  const data = useMemo(
    () =>
      samples.map((s) => ({
        ts: s.ts,
        pageLoadMs: s.pageLoadMs,
        apiLatencyMs: s.apiLatencyMs ?? 0,
      })),
    [samples],
  );

  if (data.length < 2) {
    return (
      <div className="h-52 flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
        <p className="text-xs text-muted-foreground text-center px-4">
          Collecting latency samples — refresh a couple of times to see the trend.
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="apiLatencyFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="pageLoadFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border)" strokeOpacity={0.35} vertical={false} />
        <XAxis
          dataKey="ts"
          tickFormatter={formatTime}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
          minTickGap={32}
        />
        <YAxis
          tickFormatter={formatMs}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip content={<LatencyTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)", paddingTop: 8 }}
          formatter={(value) => <span className="text-muted-foreground">{value}</span>}
        />
        <ReferenceLine
          y={200}
          stroke="#10b981"
          strokeDasharray="4 4"
          strokeOpacity={0.6}
          label={{ value: "Good API 200ms", position: "insideTopRight", fill: "#10b981", fontSize: 10 }}
        />
        <ReferenceLine
          y={800}
          stroke="#f59e0b"
          strokeDasharray="4 4"
          strokeOpacity={0.5}
          label={{ value: "Good page 800ms", position: "insideBottomRight", fill: "#f59e0b", fontSize: 10 }}
        />
        <Area
          type="monotone"
          dataKey="apiLatencyMs"
          name="API latency"
          stroke="#6366f1"
          strokeWidth={2}
          fill="url(#apiLatencyFill)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
        <Area
          type="monotone"
          dataKey="pageLoadMs"
          name="Page load"
          stroke="#f59e0b"
          strokeWidth={2}
          fill="url(#pageLoadFill)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
