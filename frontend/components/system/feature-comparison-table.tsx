"use client";

import { cn } from "@/lib/utils";
import {
  COMPETITOR_KEYS,
  COMPETITOR_LABELS,
  FEATURE_COMPARISON_MAIN,
  supportBadgeClass,
  supportLabel,
  type CompetitorKey,
  type PlatformCapability,
} from "@/lib/feature-comparison";

function TableCell({ platformKey, cap }: { platformKey: CompetitorKey; cap: PlatformCapability }) {
  const isOurs = platformKey === "mockInterviewPro";

  return (
    <td
      className={cn(
        "align-top px-3 py-3 text-left min-w-[11rem] max-w-[14rem]",
        isOurs && "bg-primary/5"
      )}
    >
      <span
        className={cn(
          "inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold mb-2",
          supportBadgeClass(cap.level)
        )}
      >
        {supportLabel(cap.level)}
      </span>
      <p className="text-[11px] leading-snug">
        <span className="font-semibold text-emerald-800 dark:text-emerald-400">Has: </span>
        <span className="text-foreground font-medium">{cap.has}</span>
      </p>
      {cap.lacks !== "—" && (
        <p className="text-[11px] leading-snug mt-1.5">
          <span className="font-semibold text-rose-800 dark:text-rose-400">Lacks: </span>
          <span className="text-muted-foreground font-medium">{cap.lacks}</span>
        </p>
      )}
    </td>
  );
}

export function FeatureComparisonTable() {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="sticky left-0 z-10 bg-card px-3 py-3 text-xs font-bold text-foreground min-w-[10rem] border-r border-border">
              Feature
            </th>
            {COMPETITOR_KEYS.map((key) => (
              <th
                key={key}
                className={cn(
                  "px-3 py-3 text-xs font-bold whitespace-nowrap",
                  key === "mockInterviewPro" ? "text-primary bg-primary/5" : "text-muted-foreground"
                )}
              >
                {COMPETITOR_LABELS[key]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FEATURE_COMPARISON_MAIN.map((row, i) => (
            <tr
              key={row.feature}
              className={cn(
                "border-b border-border hover:bg-muted/20",
                i % 2 === 1 && "bg-muted/10"
              )}
            >
              <td className="sticky left-0 z-10 bg-card px-3 py-3 text-xs font-bold text-foreground align-top border-r border-border">
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
