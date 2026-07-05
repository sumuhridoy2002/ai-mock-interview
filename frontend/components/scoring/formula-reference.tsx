"use client";

import { ExternalLink, Info } from "lucide-react";
import { getFormulaDoc } from "@/lib/scoring-docs";
import { meetsStandard } from "@/lib/scoring/benchmarks";
import { cn } from "@/lib/utils";

interface Props {
  docId: string;
  variant?: "inline" | "popover" | "chip";
  compact?: boolean;
  currentValue?: number | null;
  currentUnit?: string;
  className?: string;
}

function FormulaPanel({
  doc,
  meets,
  currentValue,
  currentUnit,
  compact = false,
}: {
  doc: NonNullable<ReturnType<typeof getFormulaDoc>>;
  meets: boolean | null;
  currentValue?: number | null;
  currentUnit?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("space-y-1.5 text-left", !compact && "space-y-2")}>
      <p
        className={cn(
          "font-mono text-primary leading-snug",
          compact ? "text-[10px]" : "text-xs"
        )}
      >
        {doc.formula}
      </p>
      <p className={cn("text-foreground", compact ? "text-[10px]" : "text-xs")}>
        <span className="font-semibold text-slate-800 dark:text-slate-100">Standard:</span>{" "}
        <span className="font-medium">{doc.industryStandard}</span>
      </p>
      {currentValue != null && meets !== null && (
        <p
          className={cn(
            "font-semibold",
            compact ? "text-[10px]" : "text-xs",
            meets ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"
          )}
        >
          {meets ? "Meets standard" : "Below standard"} ({currentValue}
          {currentUnit ?? ""})
        </p>
      )}
      {!compact && (
        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
          {doc.ratingBands}
        </p>
      )}
      {doc.references.length > 0 && (
        <ul className={cn("space-y-1", !compact && "pt-1 border-t border-border")}>
          {doc.references.map((ref) => (
            <li key={ref.url}>
              <a
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
              >
                {ref.label}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Formula + standard shown inline in the layout (default). */
export function FormulaReference({
  docId,
  variant = "inline",
  compact = false,
  currentValue,
  currentUnit,
  className,
}: Props) {
  const doc = getFormulaDoc(docId);
  if (!doc) return null;

  const meets = currentValue != null ? meetsStandard(currentValue, docId) : null;

  if (variant === "chip") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground",
          className
        )}
        title={doc.industryStandard}
      >
        <Info className="h-3 w-3 shrink-0" />
        {doc.industryStandard}
      </span>
    );
  }

  if (variant === "popover") {
    return (
      <div className={cn("rounded-lg border border-border bg-muted/30 p-2.5", className)}>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-1.5">
          {doc.title}
        </p>
        <FormulaPanel
          doc={doc}
          meets={meets}
          currentValue={currentValue}
          currentUnit={currentUnit}
          compact={compact}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-muted/40",
        compact ? "p-2 mt-2" : "p-3 mt-3",
        className
      )}
    >
      <p
        className={cn(
          "font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200 mb-1.5",
          compact ? "text-[9px]" : "text-[10px]"
        )}
      >
        {doc.title} — formula
      </p>
      <FormulaPanel
        doc={doc}
        meets={meets}
        currentValue={currentValue}
        currentUnit={currentUnit}
        compact={compact}
      />
    </div>
  );
}

export { FormulaReference as MetricCalculationInline };
