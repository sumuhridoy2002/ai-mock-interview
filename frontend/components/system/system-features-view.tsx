"use client";

import { useMemo, useState } from "react";
import { List, Search, ChevronDown } from "lucide-react";
import {
  SYSTEM_FEATURES,
  type SystemFeature,
} from "@/lib/system-features";
import { RecentWorkBanner } from "@/components/system/recent-work-banner";
import { cn } from "@/lib/utils";

function StatusBadge({ status }: { status: SystemFeature["status"] }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize",
        status === "shipped"
          ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
          : "border-amber-500/30 bg-amber-500/15 text-amber-300",
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
    <div className="rounded-xl border border-slate-700/40 bg-slate-900/50 px-4 py-3">
      <button
        type="button"
        onClick={() => hasMore && setOpen((v) => !v)}
        className={cn("w-full text-left", hasMore && "cursor-pointer")}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-slate-200">{feature.title}</p>
          <div className="flex items-center gap-2">
            <StatusBadge status={feature.status} />
            {hasMore && (
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 text-slate-500 transition-transform",
                  open && "rotate-180",
                )}
              />
            )}
          </div>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{feature.description}</p>
      </button>

      {open && hasMore && (
        <div className="mt-3 space-y-2 border-t border-slate-800 pt-3">
          {feature.details && feature.details.length > 0 && (
            <ul className="space-y-1">
              {feature.details.map((d) => (
                <li key={d} className="flex items-start gap-2 text-xs text-slate-400">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-indigo-400" />
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
                  className="rounded bg-slate-800/70 px-1.5 py-0.5 text-[10px] text-slate-400"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
          {feature.apiRoute && (
            <p className="font-mono text-[10px] text-indigo-300/90 break-all">{feature.apiRoute}</p>
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
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
          <List className="h-6 w-6 text-indigo-400" />
          Feature Catalog
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          The complete capability list for Mock Interview Pro — {SYSTEM_FEATURES.length} features
          across {categories.length} categories. Tap a feature for stack and API details.
        </p>
      </div>

      <RecentWorkBanner title="Newest features" />

      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search features..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/50 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              activeCategory === null
                ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-300"
                : "border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800",
            )}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setActiveCategory(c)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                activeCategory === c
                  ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-300"
                  : "border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {grouped.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-500">
          No features match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <div className="space-y-8">
          {grouped.map(([category, items]) => (
            <section key={category}>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {category}
                <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
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
