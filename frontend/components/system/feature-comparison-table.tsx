"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  COMPETITOR_KEYS,
  FEATURE_COMPARISON_MAIN,
  type CompetitorKey,
  type FeatureSupport,
  type PlatformCapability,
} from "@/lib/feature-comparison";

/** Shorter header labels so the table fits without horizontal scroll. */
const TABLE_HEADERS: Record<CompetitorKey, string> = {
  mockInterviewPro: "Mock Interview Pro",
  pramp: "Pramp",
  interviewingIo: "Interviewing.io",
  finalRoundAi: "Final Round AI",
  hireVue: "HireVue",
  googleWarmup: "Google Warmup",
};

function cellTone(level: FeatureSupport): string {
  switch (level) {
    case "yes":
      return "bg-emerald-500/15 dark:bg-emerald-500/20";
    case "partial":
    case "rare":
      return "bg-amber-400/15 dark:bg-amber-400/15";
    default:
      return "bg-rose-500/10 dark:bg-rose-500/15";
  }
}

function TableCell({ platformKey, cap }: { platformKey: CompetitorKey; cap: PlatformCapability }) {
  const isOurs = platformKey === "mockInterviewPro";

  return (
    <td
      className={cn(
        "align-top px-3 py-3.5 text-left break-words border-r border-border/60 last:border-r-0",
        cellTone(cap.level),
        isOurs && "border-x-2 border-x-primary/25",
      )}
    >
      <p
        className={cn(
          "text-[13px] leading-snug",
          isOurs ? "font-medium text-foreground" : "text-foreground/80",
        )}
      >
        {cap.has}
      </p>
    </td>
  );
}

export function FeatureComparisonTable() {
  return (
    <div className="w-full rounded-2xl border border-border bg-card shadow-md overflow-hidden">
      <table className="w-full table-fixed text-left border-collapse text-sm">
        <colgroup>
          <col style={{ width: "16%" }} />
          {COMPETITOR_KEYS.map((key) => (
            <col key={key} style={{ width: `${84 / COMPETITOR_KEYS.length}%` }} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-border">
            <th className="px-3 py-3 text-sm font-semibold text-muted-foreground align-bottom border-r border-border/60 bg-muted/40">
              Feature
            </th>
            {COMPETITOR_KEYS.map((key) => {
              const isOurs = key === "mockInterviewPro";
              return (
                <th
                  key={key}
                  className={cn(
                    "px-3 py-3 text-sm font-semibold leading-snug align-bottom whitespace-normal border-r border-border/60 last:border-r-0",
                    isOurs
                      ? "bg-primary/10 text-primary border-x-2 border-x-primary/25"
                      : "bg-muted/40 text-foreground",
                  )}
                >
                  {isOurs ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {TABLE_HEADERS[key]}
                    </span>
                  ) : (
                    TABLE_HEADERS[key]
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {FEATURE_COMPARISON_MAIN.map((row) => (
            <tr key={row.feature} className="border-b border-border/60 last:border-b-0">
              <td className="px-3 py-3.5 text-[13px] font-semibold text-foreground align-top border-r border-border/60 leading-snug bg-muted/20">
                {row.feature}
              </td>
              {COMPETITOR_KEYS.map((key) => (
                <TableCell key={key} platformKey={key} cap={row.platforms[key]} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
