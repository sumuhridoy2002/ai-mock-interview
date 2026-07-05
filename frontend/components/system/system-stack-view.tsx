"use client";

import { useState } from "react";
import { Server } from "lucide-react";
import { SYSTEM_COMPONENTS } from "@/lib/system-architecture";
import { PageHeader } from "@/components/layout/page-header";
import { RecentWorkBanner } from "@/components/system/recent-work-banner";

function TechnologyBadge({ technology, category }: { technology: string; category: string }) {
  return (
    <div className="text-right shrink-0">
      <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-sm font-semibold text-primary">
        {technology}
      </span>
      <p className="text-xs text-muted-foreground mt-0.5 font-medium">{category}</p>
    </div>
  );
}

function ComponentRow({ component }: { component: (typeof SYSTEM_COMPONENTS)[number] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-sm font-semibold text-foreground">{component.name}</p>
          {component.isNew && (
            <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              New
            </span>
          )}
        </div>
        <TechnologyBadge technology={component.technology} category={component.category} />
      </button>
      {open && (
        <div className="mt-3 pt-3 border-t border-border space-y-1.5 text-xs text-muted-foreground">
          <p><span className="text-foreground font-semibold">Role:</span> {component.role}</p>
          <p><span className="text-foreground font-semibold">Stack:</span> {component.stack}</p>
          <p className="font-mono text-sm break-all text-foreground">
            <span className="font-sans font-semibold">Endpoint:</span> {component.endpoint}
          </p>
        </div>
      )}
    </div>
  );
}

export function SystemStackView() {
  return (
    <div className="space-y-6">
      <PageHeader
        size="md"
        icon={Server}
        title="Technology Stack"
        subtitle="Every layer in Mock Interview Pro — tap a row to see role, stack, and endpoint."
      />

      <RecentWorkBanner />

      <div className="grid gap-3 lg:grid-cols-2">
        {SYSTEM_COMPONENTS.map((component) => (
          <ComponentRow key={component.id} component={component} />
        ))}
      </div>
    </div>
  );
}
