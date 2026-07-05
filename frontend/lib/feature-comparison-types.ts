export type FeatureSupport = "yes" | "partial" | "no" | "rare";

export type CompetitorKey =
  | "mockInterviewPro"
  | "pramp"
  | "interviewingIo"
  | "finalRoundAi"
  | "hireVue"
  | "googleWarmup";

export interface PlatformCapability {
  level: FeatureSupport;
  has: string;
  lacks: string;
}

export interface FeatureComparisonEntry {
  feature: string;
  platforms: Record<CompetitorKey, PlatformCapability>;
}

export const COMPETITOR_LABELS: Record<CompetitorKey, string> = {
  mockInterviewPro: "Mock Interview Pro",
  pramp: "Pramp",
  interviewingIo: "Interviewing.io",
  finalRoundAi: "Final Round AI",
  hireVue: "HireVue",
  googleWarmup: "Google Warmup",
};

export const COMPETITOR_KEYS = Object.keys(COMPETITOR_LABELS) as CompetitorKey[];

export function supportLabel(value: FeatureSupport): string {
  switch (value) {
    case "yes":
      return "Full support";
    case "partial":
      return "Partial";
    case "rare":
      return "Rare";
    default:
      return "Not available";
  }
}

export function supportBadgeClass(value: FeatureSupport): string {
  switch (value) {
    case "yes":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300";
    case "partial":
    case "rare":
      return "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300";
    default:
      return "border-border bg-muted/50 text-muted-foreground";
  }
}
