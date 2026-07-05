"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  COMPETITOR_KEYS,
  FEATURE_COMPARISON_MAIN,
  supportBadgeClass,
  supportLabelShort,
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

function cellTint(level: FeatureSupport, isOurs: boolean): string {
  if (isOurs) return "bg-primary/[0.07] dark:bg-primary/10";
  switch (level) {
    case "yes":
      return "bg-emerald-500/[0.06] dark:bg-emerald-500/10";
    case "partial":
    case "rare":
      return "bg-amber-500/[0.06] dark:bg-amber-500/10";
    default:
      return "bg-rose-500/[0.04] dark:bg-rose-500/[0.08]";
  }
}

function headerTint(key: CompetitorKey): string {
  if (key === "mockInterviewPro") {
    return "bg-gradient-to-b from-primary/20 to-primary/10 text-primary border-x-2 border-primary/30";
  }
  return "bg-gradient-to-b from-slate-100 to-slate-50 dark:from-slate-800/80 dark:to-slate-900/60 text-muted-foreground";
}

function TableCell({ platformKey, cap }: { platformKey: CompetitorKey; cap: PlatformCapability }) {
  const isOurs = platformKey === "mockInterviewPro";

  return (
    <td
      className={cn(
        "align-top px-2.5 py-3 text-left break-words border-r border-border/80 last:border-r-0",
        cellTint(cap.level, isOurs),
        isOurs && "border-x-2 border-x-primary/25 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.08)]",
      )}
    >
      <span
        className={cn(
          "inline-block rounded-full border px-2 py-0.5 text-sm font-bold mb-2 shadow-sm",
          supportBadgeClass(cap.level),
        )}
      >
        {supportLabelShort(cap.level)}
      </span>
      <p className="text-sm leading-snug rounded-md bg-emerald-500/10 dark:bg-emerald-500/15 px-2 py-1.5 border border-emerald-500/20">
        <span className="font-bold text-emerald-700 dark:text-emerald-400">+ </span>
        <span className="text-foreground font-medium">{cap.has}</span>
      </p>
      {cap.lacks !== "—" && (
        <p className="text-sm leading-snug mt-1.5 rounded-md bg-rose-500/10 dark:bg-rose-500/15 px-2 py-1.5 border border-rose-500/20">
          <span className="font-bold text-rose-700 dark:text-rose-400">− </span>
          <span className="text-muted-foreground font-medium">{cap.lacks}</span>
        </p>
      )}
    </td>
  );
}

export function FeatureComparisonTable() {
  return (
    <div className="w-full rounded-2xl border-2 border-primary/20 bg-card shadow-lg shadow-primary/5 overflow-hidden ring-1 ring-border">
      <table className="w-full table-fixed text-left border-collapse text-sm">
        <colgroup>
          <col style={{ width: "14%" }} />
          {COMPETITOR_KEYS.map((key) => (
            <col key={key} style={{ width: `${86 / COMPETITOR_KEYS.length}%` }} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b-2 border-primary/20">
            <th className="px-3 py-3 text-sm font-bold text-foreground align-bottom border-r-2 border-primary/20 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/50 dark:to-violet-950/40">
              Feature
            </th>
            {COMPETITOR_KEYS.map((key) => (
              <th
                key={key}
                className={cn(
                  "px-2.5 py-3 text-sm font-bold leading-snug align-bottom whitespace-normal border-r border-border/80 last:border-r-0",
                  headerTint(key),
                )}
              >
                {key === "mockInterviewPro" ? (
                  <span className="inline-flex items-center gap-1 justify-center w-full">
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                    {TABLE_HEADERS[key]}
                  </span>
                ) : (
                  TABLE_HEADERS[key]
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FEATURE_COMPARISON_MAIN.map((row, i) => (
            <tr
              key={row.feature}
              className={cn(
                "border-b border-border/70 transition-colors hover:bg-muted/20",
                i % 2 === 0 ? "bg-card" : "bg-muted/15",
              )}
            >
              <td className="px-3 py-3 text-sm font-bold text-foreground align-top border-r-2 border-primary/20 leading-snug bg-gradient-to-r from-indigo-50/80 to-transparent dark:from-indigo-950/30 dark:to-transparent">
                <span className="inline-block border-l-4 border-primary pl-2 py-0.5">{row.feature}</span>
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
