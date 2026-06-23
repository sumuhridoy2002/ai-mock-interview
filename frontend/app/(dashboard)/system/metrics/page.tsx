"use client";

import { AppShell } from "@/components/layout/app-shell";
import { SystemMetricsView } from "@/components/system/system-metrics-view";

export default function SystemMetricsPage() {
  return (
    <AppShell>
      <SystemMetricsView />
    </AppShell>
  );
}
