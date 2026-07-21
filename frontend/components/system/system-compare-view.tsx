"use client";

import { GitCompare } from "lucide-react";
import { FeatureComparisonTable } from "@/components/system/feature-comparison-table";
import { RecentWorkBanner } from "@/components/system/recent-work-banner";
import { PageHero } from "@/components/ui/page-shell";

export function SystemCompareView() {
  return (
    <div className="space-y-6">
      <PageHero
        icon={GitCompare}
        title="Compare Platforms"
        subtitle="Eight key capabilities, side by side."
        accent="emerald"
        centered
      />

      <RecentWorkBanner />

      <div className="w-full min-w-0">
        <FeatureComparisonTable />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-5 text-sm rounded-2xl border border-border bg-card py-3.5 shadow-sm">
        <span className="inline-flex items-center gap-2 font-medium text-emerald-800 dark:text-emerald-300">
          <span className="h-5 w-8 rounded-md bg-emerald-500/20 border border-emerald-500/30" aria-hidden />
          Strong fit
        </span>
        <span className="inline-flex items-center gap-2 font-medium text-amber-800 dark:text-amber-300">
          <span className="h-5 w-8 rounded-md bg-amber-400/20 border border-amber-400/35" aria-hidden />
          Limited
        </span>
        <span className="inline-flex items-center gap-2 font-medium text-rose-800 dark:text-rose-300">
          <span className="h-5 w-8 rounded-md bg-rose-500/15 border border-rose-500/25" aria-hidden />
          Missing
        </span>
      </div>
    </div>
  );
}
