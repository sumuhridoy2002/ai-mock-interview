"use client";

import { GitCompare } from "lucide-react";
import { FeatureComparisonTable } from "@/components/system/feature-comparison-table";

export function SystemCompareView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <GitCompare className="h-6 w-6 text-indigo-400" />
          Compare Platforms
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          How Mock Interview Pro compares to popular mock-interview and hiring tools — CV-based prep,
          voice capture, AI scoring, scheduling, and self-hosted stack.
        </p>
      </div>

      <FeatureComparisonTable />
    </div>
  );
}
