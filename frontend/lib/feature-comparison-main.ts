import type { FeatureComparisonEntry } from "./feature-comparison-types";

/** Top 8 capabilities for tabular / slide comparison. */
export const FEATURE_COMPARISON_MAIN: FeatureComparisonEntry[] = [
  {
    feature: "CV-based personalized questions",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "Resume parse + job description → tailored AI questions.",
        lacks: "—",
      },
      pramp: {
        level: "partial",
        has: "Peers may skim your profile before a call.",
        lacks: "No CV parse or JD-driven AI questions.",
      },
      interviewingIo: {
        level: "partial",
        has: "Role-themed question banks with humans.",
        lacks: "No upload-and-parse CV workflow.",
      },
      finalRoundAi: {
        level: "yes",
        has: "Resume + role → AI question sets.",
        lacks: "Cloud only; no self-hosted pipeline.",
      },
      hireVue: {
        level: "partial",
        has: "Employer-set role competencies.",
        lacks: "No candidate CV → AI question flow.",
      },
      googleWarmup: {
        level: "no",
        has: "Generic topic practice only.",
        lacks: "No resume or JD personalization.",
      },
    },
  },
  {
    feature: "AI scoring + PDF report",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "Per-answer AI scores, category breakdown, PDF export.",
        lacks: "—",
      },
      pramp: {
        level: "partial",
        has: "Peer ratings and comments.",
        lacks: "No AI rubric or PDF report.",
      },
      interviewingIo: {
        level: "partial",
        has: "Human interviewer feedback notes.",
        lacks: "No automated scoring or PDF.",
      },
      finalRoundAi: {
        level: "yes",
        has: "AI feedback summaries after mocks.",
        lacks: "Platform-locked; not self-hosted.",
      },
      hireVue: {
        level: "yes",
        has: "AI-assisted employer score reports.",
        lacks: "Reports owned by hiring org.",
      },
      googleWarmup: {
        level: "no",
        has: "Light hints while practicing.",
        lacks: "No scores, no PDF.",
      },
    },
  },
  {
    feature: "Cross-interview mastery memory",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "Skips mastered questions; steers weak topics next time.",
        lacks: "—",
      },
      pramp: {
        level: "no",
        has: "Independent peer sessions.",
        lacks: "No pass/skip or topic mastery memory.",
      },
      interviewingIo: {
        level: "no",
        has: "Feedback per booking only.",
        lacks: "No cross-session mastery tracking.",
      },
      finalRoundAi: {
        level: "partial",
        has: "Some session history in product.",
        lacks: "No explicit mastery skip logic.",
      },
      hireVue: {
        level: "no",
        has: "Per-assessment records.",
        lacks: "No candidate practice memory.",
      },
      googleWarmup: {
        level: "no",
        has: "Stateless practice rounds.",
        lacks: "No mastery or skip-on-pass.",
      },
    },
  },
  {
    feature: "Video behavior analysis",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "Confidence, eye contact, emotions, prosody per answer.",
        lacks: "—",
      },
      pramp: {
        level: "no",
        has: "Subjective peer impression.",
        lacks: "No automated behavior metrics.",
      },
      interviewingIo: {
        level: "no",
        has: "Human observation on video.",
        lacks: "No CV/vision scoring pipeline.",
      },
      finalRoundAi: {
        level: "no",
        has: "Text/voice answer focus.",
        lacks: "No video behavior analysis.",
      },
      hireVue: {
        level: "partial",
        has: "Enterprise tone/expression signals.",
        lacks: "Not candidate practice coaching.",
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
        has: "Laravel + Next.js + FastAPI + Ollama + Whisper on your VPS.",
        lacks: "—",
      },
      pramp: {
        level: "no",
        has: "Managed SaaS only.",
        lacks: "Cannot self-host or audit stack.",
      },
      interviewingIo: {
        level: "no",
        has: "Managed marketplace.",
        lacks: "No open deployment.",
      },
      finalRoundAi: {
        level: "no",
        has: "Cloud AI service.",
        lacks: "No on-prem option.",
      },
      hireVue: {
        level: "no",
        has: "Enterprise SaaS.",
        lacks: "No self-hosted practice env.",
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
        has: "Schedule date/time, browser alarm + email reminder.",
        lacks: "—",
      },
      pramp: {
        level: "partial",
        has: "Calendar booking with peers.",
        lacks: "No in-app alarm or custom email.",
      },
      interviewingIo: {
        level: "yes",
        has: "Book paid slots; email confirmations.",
        lacks: "Not free solo AI schedule + alarm.",
      },
      finalRoundAi: {
        level: "no",
        has: "On-demand AI mocks.",
        lacks: "No scheduled reminders.",
      },
      hireVue: {
        level: "partial",
        has: "Employer interview invites.",
        lacks: "No personal practice alarms.",
      },
      googleWarmup: {
        level: "no",
        has: "Practice anytime.",
        lacks: "No scheduling or reminders.",
      },
    },
  },
  {
    feature: "Full-session video archive",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "Full-session + per-answer video stored for replay.",
        lacks: "—",
      },
      pramp: {
        level: "no",
        has: "Live call; rarely archived.",
        lacks: "No session video library.",
      },
      interviewingIo: {
        level: "partial",
        has: "Recording on some packages.",
        lacks: "Not default for every mock.",
      },
      finalRoundAi: {
        level: "no",
        has: "Audio/text-centric flow.",
        lacks: "No full video vault.",
      },
      hireVue: {
        level: "yes",
        has: "Async/live video for employers.",
        lacks: "Employer-owned, not your library.",
      },
      googleWarmup: {
        level: "no",
        has: "No persistent video.",
        lacks: "No session archive.",
      },
    },
  },
  {
    feature: "Own your data (no lock-in)",
    platforms: {
      mockInterviewPro: {
        level: "yes",
        has: "Your MySQL, media, reports on your infrastructure.",
        lacks: "—",
      },
      pramp: {
        level: "no",
        has: "History in Pramp cloud.",
        lacks: "Cannot fully own or export stack.",
      },
      interviewingIo: {
        level: "no",
        has: "Platform-held records.",
        lacks: "No data sovereignty.",
      },
      finalRoundAi: {
        level: "no",
        has: "Account-bound cloud history.",
        lacks: "No open self-host export.",
      },
      hireVue: {
        level: "no",
        has: "Employer assessment data.",
        lacks: "Candidates don't own the stack.",
      },
      googleWarmup: {
        level: "no",
        has: "Google account history.",
        lacks: "No self-hosted ownership.",
      },
    },
  },
];
