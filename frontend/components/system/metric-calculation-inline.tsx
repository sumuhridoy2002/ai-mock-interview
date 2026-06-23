import { ExternalLink } from "lucide-react";
import { getMetricDoc } from "@/lib/performance-metric-docs";

export function MetricCalculationInline({ docId }: { docId: string }) {
  const doc = getMetricDoc(docId);
  if (!doc) return null;

  return (
    <div className="mt-2.5 pt-2.5 border-t border-slate-800/70">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600 mb-1">
        How calculated
      </p>
      <p className="font-mono text-[10px] text-indigo-300/90 leading-relaxed">{doc.formula}</p>
      <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">{doc.description}</p>
      <p className="text-[10px] text-slate-600 mt-1">{doc.ratingBands}</p>
      {doc.referenceUrl && (
        <a
          href={doc.referenceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:underline mt-1.5"
        >
          {doc.referenceLabel ?? "Reference"}
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      )}
    </div>
  );
}
