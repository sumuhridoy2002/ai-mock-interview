export type {
  CompetitorKey,
  FeatureComparisonEntry,
  FeatureSupport,
  PlatformCapability,
} from "./feature-comparison-types";

export {
  COMPETITOR_KEYS,
  COMPETITOR_LABELS,
  supportBadgeClass,
  supportLabel,
} from "./feature-comparison-types";

export { FEATURE_COMPARISON } from "./feature-comparison-data";
export { FEATURE_COMPARISON_MAIN } from "./feature-comparison-main";

/** @deprecated Use supportBadgeClass for badges; kept for any legacy class usage */
export function supportClass(value: import("./feature-comparison-types").FeatureSupport): string {
  switch (value) {
    case "yes":
      return "text-emerald-700 dark:text-emerald-400";
    case "partial":
    case "rare":
      return "text-amber-700 dark:text-amber-400";
    default:
      return "text-muted-foreground";
  }
}
