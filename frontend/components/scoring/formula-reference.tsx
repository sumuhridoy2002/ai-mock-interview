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
  const textSize = compact ? "text-sm" : "text-sm";

  return (
    <div className={cn("space-y-2 text-left", !compact && "space-y-2.5")}>
      <div>
        <p className={cn("font-semibold text-foreground mb-1", textSize)}>Formula</p>
        <pre
          className={cn(
            "font-mono text-primary leading-relaxed whitespace-pre-wrap break-words",
            textSize,
          )}
        >
          {doc.formula}
        </pre>
      </div>
      <p className={textSize}>
        <span className="font-semibold text-slate-800 dark:text-slate-100">Industry standard:</span>{" "}
        <span className="font-medium text-foreground">{doc.industryStandard}</span>
      </p>
      {currentValue != null && meets !== null && (
        <p
          className={cn(
            "font-semibold text-sm",
            meets ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"
          )}
        >
          {meets ? "Meets standard" : "Below standard"} ({currentValue}
          {currentUnit ?? ""})
        </p>
      )}
      {!compact && (
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
          <span className="font-semibold text-slate-800 dark:text-slate-200">Rating bands:</span> {doc.ratingBands}
        </p>
      )}
      {doc.references.length > 0 && (
        <div className={cn(!compact && "pt-2 border-t border-border")}>
          <p className="font-semibold text-foreground mb-1 text-sm">References</p>
          <ul className="space-y-1">
            {doc.references.map((ref) => (
              <li key={ref.url}>
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  {ref.label}
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        </div>
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
          "inline-flex items-center gap-1 rounded-md bg-muted/60 px-1.5 py-0.5 text-sm text-muted-foreground",
          className
        )}
        title={doc.industryStandard}
      >
        <Info className="h-3.5 w-3.5 shrink-0" />
        {doc.industryStandard}
      </span>
    );
  }

  if (variant === "popover") {
    return (
      <div className={cn("rounded-lg border border-border bg-muted/30 p-3", className)}>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 mb-1.5">
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
        compact ? "p-2.5 mt-2" : "p-3 mt-3",
        className
      )}
    >
      <p className="font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200 mb-1.5 text-sm">
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
