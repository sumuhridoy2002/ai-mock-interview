"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  QuestionDetailChat,
  type QuestionExplanation,
} from "@/components/interview/question-detail-chat";
import { api } from "@/lib/api";

export default function QuestionDetailPage() {
  const params = useParams<{ id: string; sequence: string }>();
  const interviewId = params.id;
  const sequence = params.sequence;
  const [data, setData] = useState<QuestionExplanation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!interviewId || !sequence) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await api<QuestionExplanation>(
          `/interviews/${interviewId}/questions/${sequence}/explain`
        );
        if (!cancelled) setData(result);
      } catch {
        if (!cancelled) {
          setData(null);
          setError("Could not load the detailed explanation. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [interviewId, sequence]);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href={`/interview/result/${interviewId}`}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to results
            </Button>
          </Link>
          <h1 className="text-xl font-semibold text-white">Model answer breakdown</h1>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-16 flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
              <p>Preparing a full model answer for this question...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center text-red-400">{error}</CardContent>
          </Card>
        ) : data ? (
          <Card className="border-slate-700/50">
            <CardContent className="pt-6">
              <QuestionDetailChat data={data} />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
