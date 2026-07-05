import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { formatScore } from "@/lib/utils";
import { isPassed } from "@/lib/scoring/interview";
import { Button } from "@/components/ui/button";
import { BehaviorPanel, type BehaviorData } from "@/components/interview/behavior-card";

interface QuestionReview {
  sequence: number;
  question: string;
  category: string;
  your_answer: string;
  score: number;
  relevance?: number;
  technical_accuracy?: number;
  communication?: number;
  confidence?: number;
  completeness?: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  model_answer?: string | null;
  needs_improvement?: boolean;
  transcript_quality_poor?: boolean;
  behavior?: BehaviorData | null;
  answer_id?: number;
  snapshot_count?: number;
}

const DIMENSION_LABELS: { key: keyof QuestionReview; label: string }[] = [
  { key: "relevance", label: "Relevance" },
  { key: "technical_accuracy", label: "Technical" },
  { key: "communication", label: "Communication" },
  { key: "completeness", label: "Completeness" },
];

function uniqueImprovements(review: QuestionReview): string[] {
  const items = [...(review.weaknesses || []), ...(review.recommendations || [])];
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

export function QuestionReviewCard({
  review,
  interviewId,
}: {
  review: QuestionReview;
  interviewId: string | number;
}) {
  const passed = isPassed(review.score);
  const improvements = uniqueImprovements(review);
  const dimensions = DIMENSION_LABELS.filter(
    (d) => typeof review[d.key] === "number"
  );

  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-900/40 p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Question {review.sequence} · {review.category.replace(/_/g, " ")}
          </p>
          <p className="text-white font-medium mt-1">{review.question}</p>
        </div>
        <div className={`text-xl font-bold shrink-0 ${passed ? "text-emerald-400" : "text-amber-400"}`}>
          {formatScore(review.score)}
        </div>
      </div>

      {dimensions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {dimensions.map(({ key, label }) => (
            <div key={key} className="rounded-md bg-slate-950/50 px-2 py-1.5">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
              <p className="text-sm font-semibold text-slate-200">
                {formatScore(review[key] as number)}
              </p>
            </div>
          ))}
        </div>
      )}

      <div>
        <p className="text-xs text-slate-500 mb-1">Your answer</p>
        {review.transcript_quality_poor && (
          <p className="text-xs text-amber-500/80 mb-1 italic">
            Captured via speech-to-text — some words may be inaccurate.
          </p>
        )}
        {review.your_answer ? (
          <p className="text-sm text-slate-300 italic">&ldquo;{review.your_answer}&rdquo;</p>
        ) : (
          <p className="text-sm text-slate-600 italic">No transcript recorded for this answer.</p>
        )}
      </div>

      {review.strengths?.length > 0 && (
        <div>
          <p className="text-xs text-emerald-400 mb-1">What went well</p>
          <ul className="text-sm text-slate-300 list-disc pl-4 space-y-1">
            {review.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {improvements.length > 0 && (
        <div>
          <p className="text-xs text-amber-400 mb-1">Improvements</p>
          <ul className="text-sm text-slate-300 list-disc pl-4 space-y-1">
            {improvements.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {review.model_answer && review.needs_improvement && (
        <div className="rounded-md bg-indigo-950/40 border border-indigo-500/30 p-3">
          <p className="text-xs text-indigo-300 mb-1 font-medium">Suggested strong answer</p>
          <p className="text-sm text-slate-200">{review.model_answer}</p>
        </div>
      )}

      {review.behavior && (
        <BehaviorPanel behavior={review.behavior} />
      )}

      <div className="pt-1">
        <Link href={`/interview/result/${interviewId}/question/${review.sequence}`}>
          <Button variant="outline" size="sm" className="gap-2 text-indigo-300 border-indigo-500/40 hover:bg-indigo-950/40">
            <MessageCircle className="h-4 w-4" />
            Go to detailed answer
          </Button>
        </Link>
      </div>
    </div>
  );
}
