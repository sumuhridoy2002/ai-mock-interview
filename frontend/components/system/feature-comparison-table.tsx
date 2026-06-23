"use client";

import {
  COMPETITOR_LABELS,
  FEATURE_COMPARISON,
  supportClass,
  supportLabel,
} from "@/lib/feature-comparison";

export function FeatureComparisonTable() {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700/50">
      <table className="w-full text-[10px] text-left">
        <thead>
          <tr className="border-b border-slate-700/60 bg-slate-900/80">
            <th className="px-2 py-2 font-semibold text-slate-400 sticky left-0 bg-slate-900/95 min-w-[140px]">
              Feature
            </th>
            {(Object.keys(COMPETITOR_LABELS) as (keyof typeof COMPETITOR_LABELS)[]).map((key) => (
              <th
                key={key}
                className={`px-2 py-2 font-semibold whitespace-nowrap ${
                  key === "mockInterviewPro" ? "text-indigo-300" : "text-slate-500"
                }`}
              >
                {COMPETITOR_LABELS[key]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FEATURE_COMPARISON.map((row) => (
            <tr key={row.feature} className="border-b border-slate-800/60 hover:bg-slate-900/40">
              <td className="px-2 py-2 text-slate-300 sticky left-0 bg-slate-950/95 font-medium">
                {row.feature}
              </td>
              {(Object.keys(COMPETITOR_LABELS) as (keyof typeof COMPETITOR_LABELS)[]).map((key) => (
                <td
                  key={key}
                  className={`px-2 py-2 text-center font-medium ${supportClass(row[key])} ${
                    key === "mockInterviewPro" ? "bg-indigo-500/5" : ""
                  }`}
                >
                  {supportLabel(row[key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
