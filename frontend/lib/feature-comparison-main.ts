import type { FeatureComparisonEntry } from "./feature-comparison-types";

/**
 * Top 8 capabilities for tabular / slide comparison.
 * Keep notes short (≤ 8 words): `has` is the single line shown in the table;
 * `lacks` is kept for accessibility/detail contexts.
 */
export const FEATURE_COMPARISON_MAIN: FeatureComparisonEntry[] = [
  {
    feature: "CV-based personalized questions",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "CV + job description drive every question.",
        lacks: "—",
      },
      pramp: {
        level: "partial",
        has: "Peers may glance at your profile.",
        lacks: "No CV parsing.",
      },
      interviewingIo: {
        level: "partial",
        has: "Role-themed banks, no CV parsing.",
        lacks: "No CV-driven questions.",
      },
      finalRoundAi: {
        level: "yes",
        has: "Resume-aware AI questions, cloud only.",
        lacks: "Not self-hosted.",
      },
      hireVue: {
        level: "partial",
        has: "Employer-defined competencies.",
        lacks: "No candidate CV flow.",
      },
      googleWarmup: {
        level: "no",
        has: "Generic topics only.",
        lacks: "No personalization.",
      },
    },
  },
  {
    feature: "AI scoring + PDF report",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "Per-answer AI scores + PDF export.",
        lacks: "—",
      },
      pramp: {
        level: "partial",
        has: "Peer ratings only.",
        lacks: "No AI rubric or PDF.",
      },
      interviewingIo: {
        level: "partial",
        has: "Human notes, no auto scoring.",
        lacks: "No PDF report.",
      },
      finalRoundAi: {
        level: "yes",
        has: "AI feedback summaries.",
        lacks: "Platform-locked.",
      },
      hireVue: {
        level: "yes",
        has: "Employer-owned score reports.",
        lacks: "Not for candidates.",
      },
      googleWarmup: {
        level: "no",
        has: "Hints only, no scores.",
        lacks: "No reports.",
      },
    },
  },
  {
    feature: "Cross-interview mastery memory",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "Skips mastered topics, targets weak ones.",
        lacks: "—",
      },
      pramp: {
        level: "no",
        has: "Sessions are independent.",
        lacks: "No mastery memory.",
      },
      interviewingIo: {
        level: "no",
        has: "Feedback per booking only.",
        lacks: "No cross-session tracking.",
      },
      finalRoundAi: {
        level: "partial",
        has: "Basic session history.",
        lacks: "No skip logic.",
      },
      hireVue: {
        level: "no",
        has: "No practice memory.",
        lacks: "Per-assessment only.",
      },
      googleWarmup: {
        level: "no",
        has: "Stateless practice rounds.",
        lacks: "Nothing carries over.",
      },
    },
  },
  {
    feature: "Video behavior analysis",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "Eye contact, emotion + confidence metrics.",
        lacks: "—",
      },
      pramp: {
        level: "no",
        has: "Peer impressions only.",
        lacks: "No automated metrics.",
      },
      interviewingIo: {
        level: "no",
        has: "Human observation only.",
        lacks: "No vision pipeline.",
      },
      finalRoundAi: {
        level: "no",
        has: "Text and voice focus.",
        lacks: "No video analysis.",
      },
      hireVue: {
        level: "partial",
        has: "Enterprise signals, not coaching.",
        lacks: "Not candidate-facing.",
      },
      googleWarmup: {
        level: "no",
        has: "No webcam analytics.",
        lacks: "No behavior scores.",
      },
    },
  },
  {
    feature: "Self-hosted open stack",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "Runs fully on your own server.",
        lacks: "—",
      },
      pramp: {
        level: "no",
        has: "Managed SaaS only.",
        lacks: "No self-hosting.",
      },
      interviewingIo: {
        level: "no",
        has: "Managed marketplace.",
        lacks: "No open deployment.",
      },
      finalRoundAi: {
        level: "no",
        has: "Cloud service only.",
        lacks: "No on-prem option.",
      },
      hireVue: {
        level: "no",
        has: "Enterprise SaaS.",
        lacks: "No self-hosting.",
      },
      googleWarmup: {
        level: "no",
        has: "Google-hosted tool.",
        lacks: "Not self-hostable.",
      },
    },
  },
  {
    feature: "Scheduling + reminders",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "Alarms + email reminders built in.",
        lacks: "—",
      },
      pramp: {
        level: "partial",
        has: "Peer calendar booking.",
        lacks: "No alarms.",
      },
      interviewingIo: {
        level: "yes",
        has: "Paid slot booking.",
        lacks: "No free AI schedule.",
      },
      finalRoundAi: {
        level: "no",
        has: "On-demand only.",
        lacks: "No reminders.",
      },
      hireVue: {
        level: "partial",
        has: "Employer invites only.",
        lacks: "No practice alarms.",
      },
      googleWarmup: {
        level: "no",
        has: "No scheduling.",
        lacks: "Practice anytime only.",
      },
    },
  },
  {
    feature: "Session replay archive",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "Every session stored for replay.",
        lacks: "—",
      },
      pramp: {
        level: "no",
        has: "Live calls, rarely archived.",
        lacks: "No video library.",
      },
      interviewingIo: {
        level: "partial",
        has: "Recording on some plans.",
        lacks: "Not default.",
      },
      finalRoundAi: {
        level: "no",
        has: "Audio/text-centric flow.",
        lacks: "No video vault.",
      },
      hireVue: {
        level: "yes",
        has: "Employer-owned recordings.",
        lacks: "Not your library.",
      },
      googleWarmup: {
        level: "no",
        has: "Nothing persists.",
        lacks: "No archive.",
      },
    },
  },
  {
    feature: "Own your data (no lock-in)",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "Your database, media and reports.",
        lacks: "—",
      },
      pramp: {
        level: "no",
        has: "History lives in Pramp cloud.",
        lacks: "No export.",
      },
      interviewingIo: {
        level: "no",
        has: "Platform-held records.",
        lacks: "No data sovereignty.",
      },
      finalRoundAi: {
        level: "no",
        has: "Account-bound cloud history.",
        lacks: "No self-host export.",
      },
      hireVue: {
        level: "no",
        has: "Employer owns the data.",
        lacks: "Candidates own nothing.",
      },
      googleWarmup: {
        level: "no",
        has: "Google account history.",
        lacks: "No ownership.",
      },
    },
  },
];
