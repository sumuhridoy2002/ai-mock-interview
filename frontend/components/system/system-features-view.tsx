"use client";

import { useMemo, useState } from "react";
import { List, Search, ChevronDown } from "lucide-react";
import {
  SYSTEM_FEATURES,
  type SystemFeature,
} from "@/lib/system-features";
import { PageHeader } from "@/components/layout/page-header";
import { RecentWorkBanner } from "@/components/system/recent-work-banner";
import { cn } from "@/lib/utils";

function StatusBadge({ status }: { status: SystemFeature["status"] }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold capitalize",
        status === "shipped"
          ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
          : "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300",
      )}
    >
      {status}
    </span>
  );
}

function FeatureCard({ feature }: { feature: SystemFeature }) {
  const [open, setOpen] = useState(false);
  const hasMore = Boolean(feature.details?.length || feature.stack?.length || feature.apiRoute);

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
      <button
        type="button"
        onClick={() => hasMore && setOpen((v) => !v)}
        className={cn("w-full text-left", hasMore && "cursor-pointer")}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">{feature.title}</p>
          <div className="flex items-center gap-2">
            <StatusBadge status={feature.status} />
            {hasMore && (
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 text-muted-foreground transition-transform",
                  open && "rotate-180",
                )}
              />
            )}
          </div>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground font-medium">{feature.description}</p>
      </button>

      {open && hasMore && (
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          {feature.details && feature.details.length > 0 && (
            <ul className="space-y-1">
              {feature.details.map((d) => (
                <li key={d} className="flex items-start gap-2 text-xs text-muted-foreground font-medium">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  {d}
                </li>
              ))}
            </ul>
          )}
          {feature.stack && feature.stack.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {feature.stack.map((s) => (
                <span
                  key={s}
                  className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
          {feature.apiRoute && (
            <p className="font-mono text-xs text-primary font-medium break-all">{feature.apiRoute}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function SystemFeaturesView() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const f of SYSTEM_FEATURES) {
      if (!seen.includes(f.category)) seen.push(f.category);
    }
    return seen;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SYSTEM_FEATURES.filter((f) => {
      if (activeCategory && f.category !== activeCategory) return false;
      if (!q) return true;
      return (
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
      );
    });
  }, [query, activeCategory]);

  const grouped = useMemo(() => {
    const map = new Map<string, SystemFeature[]>();
    for (const f of filtered) {
      const list = map.get(f.category) ?? [];
      list.push(f);
      map.set(f.category, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const filterBtn = (active: boolean) =>
    cn(
      "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
      active
        ? "border-primary/50 bg-primary/10 text-primary"
        : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
    );

  return (
    <div className="space-y-6">
      <PageHeader
        size="md"
        icon={List}
        title="Feature Catalog"
        subtitle={`The complete capability list for Mock Interview Pro — ${SYSTEM_FEATURES.length} features across ${categories.length} categories. Tap a feature for stack and API details.`}
      />

      <RecentWorkBanner title="All Platform Work" />

      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search features..."
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setActiveCategory(null)} className={filterBtn(activeCategory === null)}>
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setActiveCategory(c)}
              className={filterBtn(activeCategory === c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {grouped.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground font-medium">
          No features match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <div className="space-y-8">
          {grouped.map(([category, items]) => (
            <section key={category}>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {category}
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-foreground font-semibold">
                  {items.length}
                </span>
              </h2>
              <div className="grid gap-3 lg:grid-cols-2">
                {items.map((f) => (
                  <FeatureCard key={f.id} feature={f} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
