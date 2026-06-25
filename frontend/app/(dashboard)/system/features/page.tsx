"use client";

import { AppShell } from "@/components/layout/app-shell";
import { SystemFeaturesView } from "@/components/system/system-features-view";

export default function SystemFeaturesPage() {
  return (
    <AppShell>
      <SystemFeaturesView />
    </AppShell>
  );
}
