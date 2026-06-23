"use client";

import { Bot, User, FileText } from "lucide-react";
import { formatScore } from "@/lib/utils";
import {
  AnswerVisualBreakdown,
  type VisualBreakdown,
} from "@/components/interview/answer-visual-breakdown";

export interface QuestionExplanation {
  sequence: number;
  question: string;
  category: string;
  your_answer: string;
  score: number;
  context: string;
  gap_analysis: string;
  detailed_answer: string;
  visual_breakdown?: VisualBreakdown;
}

function Paragraphs({ text }: { text: string }) {
  const blocks = text.split(/\n\n+/).filter(Boolean);
  return (
    <div className="space-y-3">
      {blocks.map((block, i) => (
        <p key={i} className="text-sm leading-relaxed text-slate-200">
          {block.trim()}
        </p>
      ))}
    </div>
  );
}

export function QuestionDetailChat({ data }: { data: QuestionExplanation }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-700/60 bg-slate-900/40 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Question {data.sequence} · {data.category.replace(/_/g, " ")}
          </p>
          <p className="text-sm text-slate-400 mt-0.5">Full model answer walkthrough</p>
        </div>
        <p className={`text-lg font-bold ${data.score >= 70 ? "text-emerald-400" : "text-amber-400"}`}>
          {formatScore(data.score)}
        </p>
      </div>

      <div className="flex gap-3 justify-end">
        <div className="max-w-[90%] rounded-2xl px-4 py-3 bg-slate-800 border border-slate-700/60">
          <p className="text-xs text-slate-400 mb-1">Interview question</p>
          <p className="text-sm text-slate-200">{data.question}</p>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700/60 text-slate-300">
          <User className="h-4 w-4" />
        </div>
      </div>

      {data.your_answer && (
        <div className="flex gap-3 justify-end">
          <div className="max-w-[90%] rounded-2xl px-4 py-3 bg-slate-800/70 border border-slate-700/50">
            <p className="text-xs text-slate-400 mb-1">Your answer</p>
            <p className="text-sm text-slate-300 italic">&ldquo;{data.your_answer}&rdquo;</p>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700/60 text-slate-300">
            <User className="h-4 w-4" />
          </div>
        </div>
      )}

      {data.context && (
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300">
            <Bot className="h-4 w-4" />
          </div>
          <div className="flex-1 rounded-2xl px-4 py-3 bg-slate-900/80 border border-slate-700/40">
            <p className="text-xs font-medium text-indigo-300 mb-1.5">What this question tests</p>
            <p className="text-sm leading-relaxed text-slate-300">{data.context}</p>
          </div>
        </div>
      )}

      {data.gap_analysis && (
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-300">
            <Bot className="h-4 w-4" />
          </div>
          <div className="flex-1 rounded-2xl px-4 py-3 bg-slate-900/80 border border-amber-500/20">
            <p className="text-xs font-medium text-amber-300 mb-1.5">How your answer compared</p>
            <p className="text-sm leading-relaxed text-slate-300">{data.gap_analysis}</p>
          </div>
        </div>
      )}

      {data.visual_breakdown && (
        <AnswerVisualBreakdown data={data.visual_breakdown} />
      )}

      {data.detailed_answer && (
        <div className="rounded-xl border border-indigo-500/40 bg-indigo-950/30 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-indigo-500/30 bg-indigo-950/50">
            <FileText className="h-4 w-4 text-indigo-300" />
            <p className="text-sm font-semibold text-indigo-200">Full model answer you could give</p>
          </div>
          <div className="px-5 py-4">
            <Paragraphs text={data.detailed_answer} />
          </div>
        </div>
      )}
    </div>
  );
}
