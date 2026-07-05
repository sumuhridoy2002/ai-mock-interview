"use client";

import { Sparkles } from "lucide-react";
import {
  AREA_BADGE_CLASS,
  AREA_LABELS,
  RECENT_PLATFORM_WORK,
  type RecentWorkItem,
} from "@/lib/recent-platform-work";
import { CategoryHeading } from "@/components/ui/page-shell";
import { cn } from "@/lib/utils";

function WorkCard({ item }: { item: RecentWorkItem }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-4 shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-violet-500">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-bold text-foreground">{item.title}</p>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-bold shadow-sm",
            AREA_BADGE_CLASS[item.area],
          )}
        >
          {AREA_LABELS[item.area]}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
      {item.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-lg bg-muted/60 border border-border px-2 py-0.5 font-mono text-xs text-muted-foreground font-medium"
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
    <section className="rounded-2xl border border-border bg-gradient-to-br from-muted/40 to-card p-5 shadow-md">
      <CategoryHeading>
        <span className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          {title}
        </span>
      </CategoryHeading>
      <div className="grid gap-4 lg:grid-cols-2">
        {RECENT_PLATFORM_WORK.map((item) => (
          <WorkCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
