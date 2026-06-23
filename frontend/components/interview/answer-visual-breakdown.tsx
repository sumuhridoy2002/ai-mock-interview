"use client";

import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  GitBranch,
  Layers,
  Lightbulb,
  Star,
  User,
} from "lucide-react";

export interface VisualBreakdownItem {
  label: string;
  description: string;
  highlight?: string;
}

export interface VisualBreakdown {
  type: "timeline" | "star" | "flow" | "steps" | "comparison";
  title: string;
  items: VisualBreakdownItem[];
  comparison?: {
    your_answer: string;
    should_include: string;
  };
}

const STAR_COLORS = [
  "border-violet-500/40 bg-violet-950/40",
  "border-blue-500/40 bg-blue-950/40",
  "border-emerald-500/40 bg-emerald-950/40",
  "border-amber-500/40 bg-amber-950/40",
];

function TypeIcon({ type }: { type: VisualBreakdown["type"] }) {
  const cls = "h-4 w-4";
  if (type === "timeline") return <Calendar className={cls} />;
  if (type === "star") return <Star className={cls} />;
  if (type === "flow") return <GitBranch className={cls} />;
  return <Layers className={cls} />;
}

function TimelineView({ items }: { items: VisualBreakdownItem[] }) {
  return (
    <div className="relative pl-6">
      <div className="absolute left-2 top-2 bottom-2 w-px bg-indigo-500/40" />
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="relative">
            <div className="absolute -left-6 top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-indigo-400 bg-slate-900 text-[10px] font-bold text-indigo-300">
              {i + 1}
            </div>
            <div className="rounded-lg border border-slate-700/60 bg-slate-900/50 px-4 py-3">
              <p className="text-sm font-semibold text-indigo-200">{item.label}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-300">{item.description}</p>
              {item.highlight && (
                <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-2 py-0.5 text-xs text-indigo-300">
                  <CheckCircle2 className="h-3 w-3" />
                  {item.highlight}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StarView({ items }: { items: VisualBreakdownItem[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item, i) => (
        <div
          key={i}
          className={`rounded-lg border px-4 py-3 ${STAR_COLORS[i % STAR_COLORS.length]}`}
        >
          <p className="text-sm font-bold text-slate-100">{item.label}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{item.description}</p>
        </div>
      ))}
    </div>
  );
}

function FlowView({ items }: { items: VisualBreakdownItem[] }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 sm:flex-1 sm:min-w-[140px]">
          <div className="flex-1 rounded-lg border border-cyan-500/30 bg-cyan-950/30 px-3 py-3 text-center sm:text-left">
            <p className="text-xs font-bold uppercase tracking-wide text-cyan-300">{item.label}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-300 sm:text-sm">{item.description}</p>
          </div>
          {i < items.length - 1 && (
            <ArrowRight className="hidden h-4 w-4 shrink-0 text-slate-500 sm:block" />
          )}
        </div>
      ))}
    </div>
  );
}

function StepsView({ items }: { items: VisualBreakdownItem[] }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex gap-3 rounded-lg border border-slate-700/50 bg-slate-900/40 px-4 py-3"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-slate-200">
            {i + 1}
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-100">{item.label}</p>
            <p className="mt-0.5 text-sm leading-relaxed text-slate-400">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ComparisonView({
  comparison,
}: {
  comparison: NonNullable<VisualBreakdown["comparison"]>;
}) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg border border-rose-500/25 bg-rose-950/20 px-4 py-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-rose-300">
          <User className="h-3.5 w-3.5" />
          What you said
        </div>
        <p className="text-sm italic leading-relaxed text-slate-300">
          &ldquo;{comparison.your_answer}&rdquo;
        </p>
      </div>
      <div className="rounded-lg border border-emerald-500/25 bg-emerald-950/20 px-4 py-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-emerald-300">
          <Lightbulb className="h-3.5 w-3.5" />
          What to include
        </div>
        <p className="text-sm leading-relaxed text-slate-200">{comparison.should_include}</p>
      </div>
    </div>
  );
}

function TextDiagram({ type, items }: { type: VisualBreakdown["type"]; items: VisualBreakdownItem[] }) {
  if (type === "flow") {
    const line = items.map((item) => item.label).join("  →  ");
    return (
      <pre className="mt-3 overflow-x-auto rounded-md border border-slate-700/50 bg-slate-950/80 px-4 py-3 text-xs leading-relaxed text-cyan-200/90 font-mono">
        {line}
      </pre>
    );
  }

  if (type === "star") {
    const lines = items.map((item) => `┌─ ${item.label}\n│  ${item.description}`).join("\n└────────\n");
    return (
      <pre className="mt-3 overflow-x-auto rounded-md border border-slate-700/50 bg-slate-950/80 px-4 py-3 text-xs leading-relaxed text-violet-200/90 font-mono whitespace-pre-wrap">
        {lines}
      </pre>
    );
  }

  if (type === "timeline") {
    const lines = items
      .map((item, i) => {
        const connector = i < items.length - 1 ? "    │\n    ▼\n" : "";
        return `  [${item.label}]\n    ${item.description}${item.highlight ? `\n    ✓ ${item.highlight}` : ""}${connector ? `\n${connector}` : ""}`;
      })
      .join("");
    return (
      <pre className="mt-3 overflow-x-auto rounded-md border border-slate-700/50 bg-slate-950/80 px-4 py-3 text-xs leading-relaxed text-indigo-200/90 font-mono whitespace-pre-wrap">
        {lines}
      </pre>
    );
  }

  const lines = items.map((item, i) => `${i + 1}. ${item.label} — ${item.description}`).join("\n");
  return (
    <pre className="mt-3 overflow-x-auto rounded-md border border-slate-700/50 bg-slate-950/80 px-4 py-3 text-xs leading-relaxed text-slate-300 font-mono whitespace-pre-wrap">
      {lines}
    </pre>
  );
}

export function AnswerVisualBreakdown({ data }: { data: VisualBreakdown }) {
  if (!data?.items?.length) return null;

  return (
    <div className="rounded-xl border border-slate-600/40 bg-slate-900/50 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50 bg-slate-800/40">
        <TypeIcon type={data.type} />
        <p className="text-sm font-semibold text-slate-200">{data.title}</p>
        <span className="ml-auto rounded-full bg-slate-700/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
          {data.type}
        </span>
      </div>

      <div className="px-4 py-4">
        {data.type === "timeline" && <TimelineView items={data.items} />}
        {data.type === "star" && <StarView items={data.items} />}
        {data.type === "flow" && <FlowView items={data.items} />}
        {(data.type === "steps" || data.type === "comparison") && <StepsView items={data.items} />}

        <TextDiagram type={data.type} items={data.items} />

        {data.comparison && <ComparisonView comparison={data.comparison} />}
      </div>
    </div>
  );
}
