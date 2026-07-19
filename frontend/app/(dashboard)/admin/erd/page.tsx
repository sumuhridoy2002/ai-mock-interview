"use client";

import { AppShell } from "@/components/layout/app-shell";
import { DatabaseErdView } from "@/components/system/database-erd-view";

export default function AdminErdPage() {
  return (
    <AppShell>
      <DatabaseErdView />
    </AppShell>
  );
}
