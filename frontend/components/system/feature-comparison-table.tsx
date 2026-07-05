"use client";

import { cn } from "@/lib/utils";
import {
  COMPETITOR_KEYS,
  FEATURE_COMPARISON_MAIN,
  supportBadgeClass,
  supportLabelShort,
  type CompetitorKey,
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

function TableCell({ platformKey, cap }: { platformKey: CompetitorKey; cap: PlatformCapability }) {
  const isOurs = platformKey === "mockInterviewPro";

  return (
    <td className={cn("align-top px-1.5 py-2 text-left break-words", isOurs && "bg-primary/5")}>
      <span
        className={cn(
          "inline-block rounded border px-1 py-px text-[9px] font-semibold mb-1 leading-none",
          supportBadgeClass(cap.level)
        )}
      >
        {supportLabelShort(cap.level)}
      </span>
      <p className="text-[9px] leading-tight">
        <span className="font-semibold text-emerald-800 dark:text-emerald-400">+ </span>
        <span className="text-foreground">{cap.has}</span>
      </p>
      {cap.lacks !== "—" && (
        <p className="text-[9px] leading-tight mt-1">
          <span className="font-semibold text-rose-800 dark:text-rose-400">− </span>
          <span className="text-muted-foreground">{cap.lacks}</span>
        </p>
      )}
    </td>
  );
}

export function FeatureComparisonTable() {
  return (
    <div className="w-full rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <table className="w-full table-fixed text-left border-collapse">
        <colgroup>
          <col style={{ width: "13%" }} />
          {COMPETITOR_KEYS.map((key) => (
            <col key={key} style={{ width: `${87 / COMPETITOR_KEYS.length}%` }} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-1.5 py-2 text-[10px] font-bold text-foreground align-bottom border-r border-border">
              Feature
            </th>
            {COMPETITOR_KEYS.map((key) => (
              <th
                key={key}
                className={cn(
                  "px-1 py-2 text-[9px] font-bold leading-tight align-bottom whitespace-normal",
                  key === "mockInterviewPro" ? "text-primary bg-primary/5" : "text-muted-foreground"
                )}
              >
                {TABLE_HEADERS[key]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FEATURE_COMPARISON_MAIN.map((row, i) => (
            <tr
              key={row.feature}
              className={cn("border-b border-border", i % 2 === 1 && "bg-muted/10")}
            >
              <td className="px-1.5 py-2 text-[9px] font-bold text-foreground align-top border-r border-border leading-tight">
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
