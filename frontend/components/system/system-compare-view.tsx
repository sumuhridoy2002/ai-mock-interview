"use client";

import { GitCompare } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { FeatureComparisonTable } from "@/components/system/feature-comparison-table";
import { RecentWorkBanner } from "@/components/system/recent-work-banner";

export function SystemCompareView() {
  return (
    <div className="space-y-6">
      <PageHeader
        size="md"
        icon={GitCompare}
        title="Compare Platforms"
        centered
        subtitle="Top 8 capabilities in table form — Has and Lacks for each platform."
      />

      <RecentWorkBanner />

      <div className="w-full min-w-0">
        <FeatureComparisonTable />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-medium">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600 bg-emerald-500 px-2.5 py-1 text-white font-bold shadow-sm">
          Full
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500 bg-amber-400 px-2.5 py-1 text-amber-950 font-bold shadow-sm">
          Partial
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-100 px-2.5 py-1 text-rose-800 font-bold shadow-sm dark:bg-rose-950/60 dark:text-rose-200">
          None
        </span>
        <span className="text-muted-foreground">·</span>
        <span>
          <span className="font-bold text-emerald-700 dark:text-emerald-400">+</span> Has
        </span>
        <span>
          <span className="font-bold text-rose-700 dark:text-rose-400">−</span> Lacks
        </span>
      </div>
    </div>
  );
}
