import { TrendingUp, TrendingDown, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatScore } from "@/lib/utils";

interface FeedbackToastProps {
  evaluation: {
    score: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
}

export function FeedbackToast({ evaluation }: FeedbackToastProps) {
  return (
    <Card className="border-emerald-500/30 animate-in fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-emerald-400">
          <TrendingUp className="h-5 w-5" />
          Score: {formatScore(evaluation.score)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {evaluation.strengths?.length > 0 && (
          <div>
            <p className="text-emerald-400 font-medium mb-1">Strengths</p>
            <ul className="text-slate-300 list-disc pl-4">
              {evaluation.strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}
        {evaluation.weaknesses?.length > 0 && (
          <div>
            <p className="text-amber-400 font-medium mb-1 flex items-center gap-1">
              <TrendingDown className="h-4 w-4" /> Weaknesses
            </p>
            <ul className="text-slate-300 list-disc pl-4">
              {evaluation.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        )}
        {evaluation.recommendations?.length > 0 && (
          <div>
            <p className="text-indigo-400 font-medium mb-1 flex items-center gap-1">
              <Lightbulb className="h-4 w-4" /> Tips
            </p>
            <ul className="text-slate-300 list-disc pl-4">
              {evaluation.recommendations.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
