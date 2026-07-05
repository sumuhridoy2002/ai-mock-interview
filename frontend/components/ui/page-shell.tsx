"use client";

import { type ComponentType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AccentTone = "indigo" | "violet" | "emerald" | "amber" | "blue" | "rose";

const HERO_GRADIENT: Record<AccentTone, string> = {
  indigo: "from-indigo-600 via-violet-600 to-indigo-800",
  violet: "from-violet-600 via-purple-600 to-indigo-800",
  emerald: "from-emerald-600 via-teal-600 to-emerald-800",
  amber: "from-amber-500 via-orange-500 to-amber-700",
  blue: "from-blue-600 via-indigo-600 to-blue-800",
  rose: "from-rose-600 via-pink-600 to-rose-800",
};

const ICON_GRADIENT: Record<AccentTone, string> = {
  indigo: "from-indigo-500 to-violet-600",
  violet: "from-violet-500 to-purple-600",
  emerald: "from-emerald-500 to-teal-600",
  amber: "from-amber-500 to-orange-500",
  blue: "from-blue-500 to-indigo-600",
  rose: "from-rose-500 to-pink-600",
};

const BORDER_ACCENT: Record<AccentTone, string> = {
  indigo: "border-indigo-500",
  violet: "border-violet-500",
  emerald: "border-emerald-500",
  amber: "border-amber-500",
  blue: "border-blue-500",
  rose: "border-rose-500",
};

interface PageHeroProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  centered?: boolean;
  accent?: AccentTone;
  className?: string;
}

export function PageHero({
  icon: Icon,
  title,
  subtitle,
  children,
  centered = false,
  accent = "indigo",
  className,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "rounded-2xl bg-gradient-to-br p-6 sm:p-8 text-white shadow-xl overflow-hidden relative",
        HERO_GRADIENT[accent],
        accent === "indigo" && "shadow-indigo-500/20",
        className,
      )}
    >
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" aria-hidden />
      <div className="absolute -left-4 bottom-0 h-32 w-32 rounded-full bg-white/10 blur-2xl" aria-hidden />

      <div
        className={cn(
          "relative flex flex-wrap items-center gap-5",
          centered ? "justify-center text-center flex-col" : "justify-between",
        )}
      >
        <div className={cn("flex items-center gap-4 min-w-0", centered && "flex-col")}>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm shadow-lg">
            <Icon className="h-7 w-7 text-white" />
          </div>
          <div className={cn("min-w-0", centered && "max-w-2xl")}>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle && (
              <p className="mt-1.5 text-sm text-white/85 leading-relaxed font-medium">{subtitle}</p>
            )}
          </div>
        </div>
        {children && <div className={cn("shrink-0", centered && "w-full flex justify-center")}>{children}</div>}
      </div>
    </section>
  );
}

interface StatTileProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  accent?: AccentTone;
  hint?: string;
  className?: string;
}

export function StatTile({ icon: Icon, label, value, accent = "indigo", hint, className }: StatTileProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border-l-4 border border-border bg-card p-5 shadow-md hover:shadow-lg transition-shadow",
        BORDER_ACCENT[accent],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md",
            ICON_GRADIENT[accent],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold font-mono tracking-tight text-foreground mt-0.5">{value}</p>
      {hint && <p className="mt-2 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

interface SectionPanelProps {
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  children: ReactNode;
  className?: string;
  headerRight?: ReactNode;
}

export function SectionPanel({
  title,
  description,
  icon: Icon,
  children,
  className,
  headerRight,
}: SectionPanelProps) {
  return (
    <section className={cn("rounded-2xl border border-border bg-card p-5 shadow-md", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-600 text-white shadow-md">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div>
            <h2 className="text-base font-bold text-foreground">{title}</h2>
            {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
          </div>
        </div>
        {headerRight}
      </div>
      {children}
    </section>
  );
}

interface FilterChipProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

export function FilterChip({ active, onClick, children }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all shadow-sm",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-primary/25"
          : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: ComponentType<{ className?: string }>;
}

export function SearchField({ value, onChange, placeholder = "Search…", icon: Icon }: SearchFieldProps) {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-xl border border-border bg-card py-2.5 text-sm font-medium text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
          Icon ? "pl-10 pr-4" : "px-4",
        )}
      />
    </div>
  );
}

export function CategoryHeading({ children, count }: { children: ReactNode; count?: number }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
      <span className="h-2 w-2 rounded-full bg-primary" />
      {children}
      {count != null && (
        <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
          {count}
        </span>
      )}
    </h2>
  );
}
