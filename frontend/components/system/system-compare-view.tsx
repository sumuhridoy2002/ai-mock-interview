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
        subtitle="Top 8 capabilities — what each platform has and lacks, side by side."
        accent="emerald"
        centered
      />

      <RecentWorkBanner />

      <div className="w-full min-w-0">
        <FeatureComparisonTable />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-medium rounded-2xl border border-border bg-card py-4 shadow-md">
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
