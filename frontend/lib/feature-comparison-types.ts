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

export function supportLabelShort(value: FeatureSupport): string {
  switch (value) {
    case "yes":
      return "Full";
    case "partial":
      return "Partial";
    case "rare":
      return "Rare";
    default:
      return "None";
  }
}

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
      return "border-emerald-600 bg-emerald-500 text-white dark:bg-emerald-600 dark:border-emerald-500";
    case "partial":
      return "border-amber-500 bg-amber-400 text-amber-950 dark:bg-amber-500/90 dark:text-amber-950";
    case "rare":
      return "border-orange-400 bg-orange-300 text-orange-950 dark:bg-orange-500/80 dark:text-orange-950";
    default:
      return "border-rose-300 bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:border-rose-700 dark:text-rose-200";
  }
}
