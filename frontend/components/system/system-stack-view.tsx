"use client";

import { useState } from "react";
import { Server } from "lucide-react";
import { SYSTEM_COMPONENTS } from "@/lib/system-architecture";
import { RecentWorkBanner } from "@/components/system/recent-work-banner";
import { PageHero } from "@/components/ui/page-shell";

function TechnologyBadge({ technology, category }: { technology: string; category: string }) {
  return (
    <div className="text-right shrink-0">
      <span className="rounded-full border border-primary/30 bg-primary text-primary-foreground px-3 py-1 text-sm font-bold shadow-sm">
        {technology}
      </span>
      <p className="text-xs text-muted-foreground mt-1 font-medium">{category}</p>
    </div>
  );
}

function ComponentRow({ component }: { component: (typeof SYSTEM_COMPONENTS)[number] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-4 shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-sm font-bold text-foreground">{component.name}</p>
          {component.isNew && (
            <span className="shrink-0 rounded-full border border-emerald-600 bg-emerald-500 px-2 py-0.5 text-xs font-bold uppercase text-white shadow-sm">
              New
            </span>
          )}
        </div>
        <TechnologyBadge technology={component.technology} category={component.category} />
      </button>
      {open && (
        <div className="mt-3 pt-3 border-t border-border space-y-2 text-sm text-muted-foreground rounded-lg bg-muted/30 p-3">
          <p><span className="text-foreground font-semibold">Role:</span> {component.role}</p>
          <p><span className="text-foreground font-semibold">Stack:</span> {component.stack}</p>
          <p className="font-mono text-sm break-all text-primary">
            <span className="font-sans font-semibold text-foreground">Endpoint:</span> {component.endpoint}
          </p>
        </div>
      )}
    </div>
  );
}

export function SystemStackView() {
  return (
    <div className="space-y-6">
      <PageHero
        icon={Server}
        title="Technology Stack"
        subtitle="Every layer in Mock Interview Pro — tap a row for role, stack, and endpoint."
        accent="blue"
      />

      <RecentWorkBanner />

      <div className="grid gap-4 lg:grid-cols-2">
        {SYSTEM_COMPONENTS.map((component) => (
          <ComponentRow key={component.id} component={component} />
        ))}
      </div>
    </div>
  );
}
