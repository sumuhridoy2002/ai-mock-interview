"use client";

import { useState, type ReactNode } from "react";
import {
  AudioLines,
  Bot,
  Boxes,
  Route,
  UserRoundCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DiagramTheme,
  SystemMethodologyDiagram,
} from "@/components/system/system-methodology-diagram";
import {
  AiInterviewFlowchart,
  ArchitectureFlowchart,
  AuthResumeFlowchart,
  SpeechEvaluationFlowchart,
} from "@/components/system/system-workflow-flowcharts";
import { SystemUseCaseDiagram } from "@/components/system/system-use-case-diagram";

type WorkflowTab =
  | "architecture"
  | "use-cases"
  | "auth-resume"
  | "ai-interview"
  | "speech-evaluation"
  | "journey-runtime";

interface StepCopy {
  title: string;
  description: string;
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

function StepGuide({ steps }: { steps: StepCopy[] }) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {steps.map((step, index) => (
        <div
          key={step.title}
          className="rounded-lg border border-border/80 bg-background/80 px-3 py-2.5"
        >
          <p className="text-[13px] font-semibold text-primary leading-snug">
            <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 align-middle text-[11px] font-bold text-primary">
              {index + 1}
            </span>
            {step.title}
          </p>
          <p className="mt-1.5 pl-0.5 text-xs leading-relaxed text-muted-foreground">
            {step.description}
          </p>
        </div>
      ))}
    </div>
  );
}

function FlowchartWithSteps({
  diagram,
  steps,
  diagramMaxWidth,
}: {
  diagram: ReactNode;
  steps: StepCopy[];
  diagramMaxWidth?: string;
}) {
  return (
    <div className="grid overflow-hidden rounded-xl border border-border lg:grid-cols-2 lg:items-stretch divide-y lg:divide-y-0 lg:divide-x divide-border">
      <div className="flex min-h-[280px] flex-col justify-center bg-card p-3 sm:p-4">
        <div className={cn("mx-auto w-full", diagramMaxWidth)}>{diagram}</div>
      </div>
      <div className="flex min-h-[280px] flex-col justify-center bg-muted/15 p-3 sm:p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Step guide
        </p>
        <StepGuide steps={steps} />
      </div>
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
  const steps: StepCopy[] = [
    {
      title: "Browser (Next.js)",
      description: "Dashboard, live room, reports, and media capture.",
    },
    {
      title: "Laravel API",
      description: "Sanctum auth, business rules, uploads, REST endpoints.",
    },
    {
      title: "Reverb + Queues",
      description: "Real-time events plus high / default / low priority jobs.",
    },
    {
      title: "FastAPI AI Service",
      description: "Orchestrates Ollama, Whisper, and the vision pipeline.",
    },
    {
      title: "Data Layer",
      description: "MySQL, Redis cache, media files, and PDF reports.",
    },
  ];

  return (
    <WorkflowFrame
      title="Overall Implementation Architecture"
      subtitle="A self-hosted, event-driven platform split into five clear layers."
      footer="Primary flow: Browser → Laravel → queues / WebSocket → AI services → persistent storage"
    >
      <FlowchartWithSteps
        diagram={<ArchitectureFlowchart />}
        steps={steps}
        diagramMaxWidth="max-w-[560px]"
      />
    </WorkflowFrame>
  );
}

function AuthResumeWorkflow() {
  const steps: StepCopy[] = [
    {
      title: "Register or Sign In",
      description: "Credentials are validated by Laravel.",
    },
    {
      title: "Sanctum Session",
      description: "A bearer token protects every private API call.",
    },
    {
      title: "Resume Check",
      description: "Existing profiles skip straight to interview setup.",
    },
    {
      title: "Upload + Parse in Queue",
      description: "PDF/DOCX stored; skills, education, and experience extracted.",
    },
    {
      title: "Profile Ready",
      description: "Structured CV data personalizes every interview.",
    },
  ];

  return (
    <WorkflowFrame
      title="User Authentication and Resume Management"
      subtitle="From secure account access to an interview-ready candidate profile."
      footer="Result: authenticated user + reusable structured resume profile"
    >
      <FlowchartWithSteps
        diagram={<AuthResumeFlowchart />}
        steps={steps}
        diagramMaxWidth="max-w-[480px]"
      />
    </WorkflowFrame>
  );
}

function AiInterviewWorkflow() {
  const steps: StepCopy[] = [
    {
      title: "Interview Setup",
      description: "Choose CV, role, job description, level, and type.",
    },
    {
      title: "Generate Question",
      description: "AI uses role context, CV, history, and mastery memory.",
    },
    {
      title: "Deliver Live",
      description: "Reverb pushes the question to the browser instantly.",
    },
    {
      title: "Answer + Save",
      description: "Transcript, timing, and snapshots are persisted.",
    },
    {
      title: "Adapt or Finish",
      description: "Next question avoids mastered topics; last answer triggers scoring.",
    },
  ];

  return (
    <WorkflowFrame
      title="AI Interview Processing Workflow"
      subtitle="Each interview turn is generated, delivered, saved, and adapted in real time."
      footer="The next-question queue stays independent from slower answer evaluation"
    >
      <FlowchartWithSteps
        diagram={<AiInterviewFlowchart />}
        steps={steps}
        diagramMaxWidth="max-w-[480px]"
      />
    </WorkflowFrame>
  );
}

function SpeechEvaluationWorkflow() {
  const steps: StepCopy[] = [
    {
      title: "Answer Recorded",
      description: "Browser captures per-question audio and video.",
    },
    {
      title: "Whisper Transcript",
      description: "Speech is converted to clean, normalized text.",
    },
    {
      title: "Parallel Analysis",
      description: "Ollama scores content while vision reads behavior signals.",
    },
    {
      title: "Combine Scores",
      description: "A weighted rubric merges content and delivery.",
    },
    {
      title: "Store Feedback",
      description: "Scores, coaching notes, and mastery feed the report.",
    },
  ];

  return (
    <WorkflowFrame
      title="Speech Processing and Response Evaluation"
      subtitle="Answer content and delivery signals are processed in parallel, then combined."
      footer="Final output: per-answer score + coaching feedback + behavior context"
    >
      <FlowchartWithSteps
        diagram={<SpeechEvaluationFlowchart />}
        steps={steps}
        diagramMaxWidth="max-w-[520px]"
      />
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
        <DiagramTheme>
          <ActiveWorkflow tab={activeTab} />
        </DiagramTheme>
      </div>
    </div>
  );
}
