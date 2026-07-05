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
      <p className="text-sm text-muted-foreground text-center font-medium">
        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">+</span> Has ·{" "}
        <span className="text-rose-700 dark:text-rose-400 font-semibold">−</span> Lacks
      </p>
    </div>
  );
}
