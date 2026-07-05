"use client";

import { Sparkles } from "lucide-react";
import {
  AREA_BADGE_CLASS,
  AREA_LABELS,
  RECENT_PLATFORM_WORK,
  type RecentWorkItem,
} from "@/lib/recent-platform-work";
import { cn } from "@/lib/utils";

function WorkCard({ item }: { item: RecentWorkItem }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">{item.title}</p>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
            AREA_BADGE_CLASS[item.area],
          )}
        >
          {AREA_LABELS[item.area]}
        </span>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground font-medium">{item.summary}</p>
      {item.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function RecentWorkBanner({ title = "All Platform Work" }: { title?: string }) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        {title}
      </h2>
      <div className="grid gap-3 lg:grid-cols-2">
        {RECENT_PLATFORM_WORK.map((item) => (
          <WorkCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
