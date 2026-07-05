"use client";

import { useMemo, useState } from "react";
import { List, Search, ChevronDown } from "lucide-react";
import {
  SYSTEM_FEATURES,
  type SystemFeature,
} from "@/lib/system-features";
import { RecentWorkBanner } from "@/components/system/recent-work-banner";
import {
  CategoryHeading,
  FilterChip,
  PageHero,
  SearchField,
} from "@/components/ui/page-shell";
import { cn } from "@/lib/utils";

function StatusBadge({ status }: { status: SystemFeature["status"] }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide shadow-sm",
        status === "shipped"
          ? "border-emerald-600 bg-emerald-500 text-white"
          : "border-amber-500 bg-amber-400 text-amber-950",
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
    <div className="rounded-2xl border border-border bg-card px-4 py-4 shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-primary/40">
      <button
        type="button"
        onClick={() => hasMore && setOpen((v) => !v)}
        className={cn("w-full text-left", hasMore && "cursor-pointer")}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-bold text-foreground">{feature.title}</p>
          <div className="flex items-center gap-2">
            <StatusBadge status={feature.status} />
            {hasMore && (
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  open && "rotate-180",
                )}
              />
            )}
          </div>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
      </button>

      {open && hasMore && (
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          {feature.details && feature.details.length > 0 && (
            <ul className="space-y-1.5">
              {feature.details.map((d) => (
                <li key={d} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {d}
                </li>
              ))}
            </ul>
          )}
          {feature.stack && feature.stack.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {feature.stack.map((s) => (
                <span
                  key={s}
                  className="rounded-lg bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-medium text-primary"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
          {feature.apiRoute && (
            <p className="font-mono text-sm text-primary font-medium break-all rounded-lg bg-muted/50 px-2 py-1.5">
              {feature.apiRoute}
            </p>
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

  return (
    <div className="space-y-6">
      <PageHero
        icon={List}
        title="Feature Catalog"
        subtitle={`${SYSTEM_FEATURES.length} capabilities across ${categories.length} categories — tap any feature for stack and API details.`}
        accent="violet"
      />

      <RecentWorkBanner title="All Platform Work" />

      <div className="rounded-2xl border border-border bg-card p-4 shadow-md space-y-4">
        <SearchField value={query} onChange={setQuery} placeholder="Search features…" icon={Search} />
        <div className="flex flex-wrap gap-2">
          <FilterChip active={activeCategory === null} onClick={() => setActiveCategory(null)}>
            All
          </FilterChip>
          {categories.map((c) => (
            <FilterChip key={c} active={activeCategory === c} onClick={() => setActiveCategory(c)}>
              {c}
            </FilterChip>
          ))}
        </div>
      </div>

      {grouped.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground font-medium rounded-2xl border border-dashed border-border">
          No features match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <div className="space-y-8">
          {grouped.map(([category, items]) => (
            <section key={category}>
              <CategoryHeading count={items.length}>{category}</CategoryHeading>
              <div className="grid gap-4 lg:grid-cols-2">
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
