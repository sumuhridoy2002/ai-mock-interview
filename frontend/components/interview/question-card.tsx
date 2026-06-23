import { MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuestionCardProps {
  question: string;
  category: string;
  sequence: number;
  maxQuestions?: number;
}

export function QuestionCard({ question, category, sequence, maxQuestions = 10 }: QuestionCardProps) {
  return (
    <Card className="border-indigo-500/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-indigo-400" />
            Question {sequence} of {maxQuestions}
          </CardTitle>
          <span className="text-xs uppercase tracking-wide px-2 py-1 rounded bg-indigo-500/20 text-indigo-300">
            {category.replace("_", " ")}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-lg text-white leading-relaxed">{question}</p>
      </CardContent>
    </Card>
  );
}
