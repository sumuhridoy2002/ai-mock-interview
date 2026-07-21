"use client";

import { useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowRight,
  AudioLines,
  Bot,
  Boxes,
  CheckCircle2,
  Database,
  FileText,
  LockKeyhole,
  Route,
  ServerCog,
  UserRoundCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SystemMethodologyDiagram } from "@/components/system/system-methodology-diagram";
import { SystemUseCaseDiagram } from "@/components/system/system-use-case-diagram";

type WorkflowTab =
  | "architecture"
  | "use-cases"
  | "auth-resume"
  | "ai-interview"
  | "speech-evaluation"
  | "journey-runtime";

type Tone = "indigo" | "violet" | "emerald" | "amber" | "sky";

interface FlowStep {
  title: string;
  description: string;
  icon: LucideIcon;
  tone: Tone;
}

const TABS: Array<{
  id: WorkflowTab;
  shortLabel: string;
  label: string;
  icon: LucideIcon;
}> = [
  {
    id: "architecture",
    shortLabel: "Architecture",
    label: "Overall Implementation Architecture",
    icon: Boxes,
  },
  {
    id: "use-cases",
    shortLabel: "Use Cases",
    label: "Use Case Diagram — Candidate and System Admin",
    icon: Users,
  },
  {
    id: "auth-resume",
    shortLabel: "Auth + Resume",
    label: "User Authentication and Resume Management Workflow",
    icon: UserRoundCheck,
  },
  {
    id: "ai-interview",
    shortLabel: "AI Interview",
    label: "AI Interview Processing Workflow",
    icon: Bot,
  },
  {
    id: "speech-evaluation",
    shortLabel: "Speech + Scoring",
    label: "Speech Processing and Response Evaluation Workflow",
    icon: AudioLines,
  },
  {
    id: "journey-runtime",
    shortLabel: "Journey + Runtime",
    label: "End-to-end User Journey and Runtime Architecture",
    icon: Route,
  },
];

const TONE_STYLES: Record<Tone, string> = {
  indigo: "border-indigo-300/70 bg-indigo-500/10 text-indigo-700 dark:border-indigo-700 dark:text-indigo-300",
  violet: "border-violet-300/70 bg-violet-500/10 text-violet-700 dark:border-violet-700 dark:text-violet-300",
  emerald: "border-emerald-300/70 bg-emerald-500/10 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300",
  amber: "border-amber-300/70 bg-amber-500/10 text-amber-800 dark:border-amber-700 dark:text-amber-300",
  sky: "border-sky-300/70 bg-sky-500/10 text-sky-700 dark:border-sky-700 dark:text-sky-300",
};

function FlowNode({ step, number }: { step: FlowStep; number: number }) {
  const Icon = step.icon;

  return (
    <div
      className={cn(
        "relative min-w-0 flex-1 rounded-2xl border p-4 shadow-sm",
        TONE_STYLES[step.tone],
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-background/80 shadow-sm">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-background/70 px-1.5 text-[11px] font-bold">
          {number}
        </span>
      </div>
      <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{step.description}</p>
    </div>
  );
}

function FlowConnector() {
  return (
    <div className="flex shrink-0 items-center justify-center text-primary/55">
      <ArrowDown className="h-5 w-5 lg:hidden" />
      <ArrowRight className="hidden h-5 w-5 lg:block" />
    </div>
  );
}

function HorizontalFlow({ steps }: { steps: FlowStep[] }) {
  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
      {steps.map((step, index) => (
        <div className="contents" key={step.title}>
          <FlowNode step={step} number={index + 1} />
          {index < steps.length - 1 && <FlowConnector />}
        </div>
      ))}
    </div>
  );
}

function WorkflowFrame({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-gradient-to-r from-primary/10 via-violet-500/5 to-transparent px-5 py-4">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
      {footer && (
        <div className="border-t border-border bg-muted/20 px-5 py-3 text-xs text-muted-foreground">
          {footer}
        </div>
      )}
    </section>
  );
}

function ArchitectureWorkflow() {
  const steps: FlowStep[] = [
    {
      title: "Next.js Client",
      description: "Dashboard, live room, reports, media capture.",
      icon: Boxes,
      tone: "sky",
    },
    {
      title: "Laravel API",
      description: "Sanctum auth, business rules, uploads, REST endpoints.",
      icon: ServerCog,
      tone: "indigo",
    },
    {
      title: "Queue + Reverb",
      description: "Priority jobs and real-time interview events.",
      icon: Route,
      tone: "violet",
    },
    {
      title: "FastAPI AI",
      description: "Question, scoring, speech, vision orchestration.",
      icon: Bot,
      tone: "amber",
    },
    {
      title: "Data Layer",
      description: "MySQL, Redis cache, reports, and media files.",
      icon: Database,
      tone: "emerald",
    },
  ];

  return (
    <WorkflowFrame
      title="Overall Implementation Architecture"
      subtitle="A self-hosted, event-driven platform split into five clear layers."
      footer="Primary flow: Browser → Laravel → queues / WebSocket → AI services → persistent storage"
    >
      <HorizontalFlow steps={steps} />
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {[
          ["Real time", "Reverb pushes questions without page refresh."],
          ["Non-blocking", "High and low priority queues separate question generation from scoring."],
          ["Private by design", "Ollama, Whisper, media, and data remain on your infrastructure."],
        ].map(([title, description]) => (
          <div key={title} className="rounded-xl border border-border bg-muted/25 p-3">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>
    </WorkflowFrame>
  );
}

function AuthResumeWorkflow() {
  const steps: FlowStep[] = [
    {
      title: "Register or Sign In",
      description: "Credentials are validated by Laravel.",
      icon: UserRoundCheck,
      tone: "indigo",
    },
    {
      title: "Sanctum Session",
      description: "A bearer token protects private API calls.",
      icon: LockKeyhole,
      tone: "violet",
    },
    {
      title: "Upload Resume",
      description: "PDF or DOCX is validated and stored.",
      icon: FileText,
      tone: "sky",
    },
    {
      title: "Parse in Queue",
      description: "Skills, education, and experience are extracted.",
      icon: ServerCog,
      tone: "amber",
    },
    {
      title: "Profile Ready",
      description: "Structured CV data personalizes interviews.",
      icon: CheckCircle2,
      tone: "emerald",
    },
  ];

  return (
    <WorkflowFrame
      title="User Authentication and Resume Management"
      subtitle="From secure account access to an interview-ready candidate profile."
      footer="Result: authenticated user + reusable structured resume profile"
    >
      <HorizontalFlow steps={steps} />
    </WorkflowFrame>
  );
}

function AiInterviewWorkflow() {
  const steps: FlowStep[] = [
    {
      title: "Interview Setup",
      description: "Choose CV, role, job description, level, and type.",
      icon: FileText,
      tone: "sky",
    },
    {
      title: "Generate Question",
      description: "AI uses role context, CV, history, and mastery.",
      icon: Bot,
      tone: "violet",
    },
    {
      title: "Deliver Live",
      description: "Reverb sends the question to the browser.",
      icon: Route,
      tone: "indigo",
    },
    {
      title: "Save Answer",
      description: "Transcript, timing, and snapshots are persisted.",
      icon: Database,
      tone: "amber",
    },
    {
      title: "Adapt Next Turn",
      description: "The next question avoids repetition and mastered topics.",
      icon: CheckCircle2,
      tone: "emerald",
    },
  ];

  return (
    <WorkflowFrame
      title="AI Interview Processing Workflow"
      subtitle="Each interview turn is generated, delivered, saved, and adapted in real time."
      footer="The next-question queue stays independent from slower answer evaluation"
    >
      <HorizontalFlow steps={steps} />
    </WorkflowFrame>
  );
}

function SpeechEvaluationWorkflow() {
  const steps: FlowStep[] = [
    {
      title: "Capture Speech",
      description: "Browser records audio and displays live speech preview.",
      icon: AudioLines,
      tone: "sky",
    },
    {
      title: "Build Transcript",
      description: "Speech text is cleaned and normalized.",
      icon: FileText,
      tone: "indigo",
    },
    {
      title: "Evaluate Content",
      description: "AI scores relevance, accuracy, communication, and completeness.",
      icon: Bot,
      tone: "violet",
    },
    {
      title: "Analyze Behavior",
      description: "Snapshots add confidence, gaze, and emotion context.",
      icon: ServerCog,
      tone: "amber",
    },
    {
      title: "Store Feedback",
      description: "Scores, coaching notes, and mastery updates feed the report.",
      icon: CheckCircle2,
      tone: "emerald",
    },
  ];

  return (
    <WorkflowFrame
      title="Speech Processing and Response Evaluation"
      subtitle="Answer content and delivery signals are processed in parallel, then combined."
      footer="Final output: per-answer score + coaching feedback + behavior context"
    >
      <HorizontalFlow steps={steps} />
    </WorkflowFrame>
  );
}

function UseCaseWorkflow() {
  return (
    <WorkflowFrame
      title="Use Case Diagram"
      subtitle="What each role can do — Candidate practice flows and System Admin operations."
      footer="Green ovals are shared by both roles; indigo is candidate-only, purple is admin-only."
    >
      <SystemUseCaseDiagram />
    </WorkflowFrame>
  );
}

function ActiveWorkflow({ tab }: { tab: WorkflowTab }) {
  switch (tab) {
    case "architecture":
      return <ArchitectureWorkflow />;
    case "use-cases":
      return <UseCaseWorkflow />;
    case "auth-resume":
      return <AuthResumeWorkflow />;
    case "ai-interview":
      return <AiInterviewWorkflow />;
    case "speech-evaluation":
      return <SpeechEvaluationWorkflow />;
    default:
      return <SystemMethodologyDiagram />;
  }
}

export function SystemWorkflowTabs() {
  const [activeTab, setActiveTab] = useState<WorkflowTab>("architecture");

  return (
    <div className="space-y-5">
      <div
        className="grid gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        role="tablist"
        aria-label="How it works diagrams"
        data-page-export-ignore
      >
        {TABS.map(({ id, shortLabel, label, icon: Icon }, index) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            aria-controls={`workflow-panel-${id}`}
            onClick={() => setActiveTab(id)}
            title={label}
            className={cn(
              "flex min-h-12 items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors",
              activeTab === id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-background/15">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="mr-1 text-xs opacity-70">{index + 1}.</span>
              {shortLabel}
            </span>
          </button>
        ))}
      </div>

      <div
        id={`workflow-panel-${activeTab}`}
        role="tabpanel"
        aria-label={TABS.find((tab) => tab.id === activeTab)?.label}
      >
        <ActiveWorkflow tab={activeTab} />
      </div>
    </div>
  );
}
