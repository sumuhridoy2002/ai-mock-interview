export type FeatureSupport = "yes" | "partial" | "no" | "rare";

export interface FeatureRow {
  feature: string;
  mockInterviewPro: FeatureSupport;
  pramp: FeatureSupport;
  interviewingIo: FeatureSupport;
  finalRoundAi: FeatureSupport;
  hireVue: FeatureSupport;
  googleWarmup: FeatureSupport;
}

export const FEATURE_COMPARISON: FeatureRow[] = [
  {
    feature: "CV-based personalized questions",
    mockInterviewPro: "yes",
    pramp: "partial",
    interviewingIo: "partial",
    finalRoundAi: "yes",
    hireVue: "partial",
    googleWarmup: "no",
  },
  {
    feature: "Voice + video answer capture",
    mockInterviewPro: "yes",
    pramp: "yes",
    interviewingIo: "yes",
    finalRoundAi: "partial",
    hireVue: "yes",
    googleWarmup: "no",
  },
  {
    feature: "AI scoring + PDF report",
    mockInterviewPro: "yes",
    pramp: "partial",
    interviewingIo: "partial",
    finalRoundAi: "yes",
    hireVue: "yes",
    googleWarmup: "no",
  },
  {
    feature: "Interview scheduling + reminders",
    mockInterviewPro: "yes",
    pramp: "partial",
    interviewingIo: "yes",
    finalRoundAi: "no",
    hireVue: "partial",
    googleWarmup: "no",
  },
  {
    feature: "Browser + email reminders",
    mockInterviewPro: "yes",
    pramp: "no",
    interviewingIo: "partial",
    finalRoundAi: "no",
    hireVue: "partial",
    googleWarmup: "no",
  },
  {
    feature: "Self-hosted / open stack",
    mockInterviewPro: "yes",
    pramp: "no",
    interviewingIo: "no",
    finalRoundAi: "no",
    hireVue: "no",
    googleWarmup: "no",
  },
  {
    feature: "Real-time question delivery (WebSocket)",
    mockInterviewPro: "yes",
    pramp: "no",
    interviewingIo: "yes",
    finalRoundAi: "no",
    hireVue: "partial",
    googleWarmup: "no",
  },
  {
    feature: "Structured answer explanations (STAR/timeline)",
    mockInterviewPro: "yes",
    pramp: "no",
    interviewingIo: "partial",
    finalRoundAi: "partial",
    hireVue: "partial",
    googleWarmup: "partial",
  },
  {
    feature: "Role-aware question fallbacks",
    mockInterviewPro: "yes",
    pramp: "partial",
    interviewingIo: "partial",
    finalRoundAi: "yes",
    hireVue: "partial",
    googleWarmup: "no",
  },
  {
    feature: "Live performance monitoring",
    mockInterviewPro: "yes",
    pramp: "no",
    interviewingIo: "no",
    finalRoundAi: "no",
    hireVue: "no",
    googleWarmup: "no",
  },
];

export const COMPETITOR_LABELS = {
  mockInterviewPro: "Mock Interview Pro",
  pramp: "Pramp",
  interviewingIo: "Interviewing.io",
  finalRoundAi: "Final Round AI",
  hireVue: "HireVue",
  googleWarmup: "Google Warmup",
} as const;

export function supportLabel(value: FeatureSupport): string {
  switch (value) {
    case "yes":
      return "Yes";
    case "partial":
      return "Partial";
    case "rare":
      return "Rare";
    default:
      return "No";
  }
}

export function supportClass(value: FeatureSupport): string {
  switch (value) {
    case "yes":
      return "text-emerald-400";
    case "partial":
    case "rare":
      return "text-amber-400";
    default:
      return "text-slate-500";
  }
}
