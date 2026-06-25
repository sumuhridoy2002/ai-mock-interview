"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Download, ArrowLeft, Award } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuestionReviewCard } from "@/components/interview/question-review-card";
import { AggregateBehaviorCard, type AggregateBehavior } from "@/components/interview/behavior-card";
import { api, API_URL } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { formatScore } from "@/lib/utils";

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
  behavior?: {
    confidence: number;
    nervousness: number;
    eye_contact_ratio: number;
    head_stability: number;
    blink_rate: number;
    emotion_distribution?: Record<string, number>;
    coaching_narrative?: string | null;
  } | null;
}

interface ReportData {
  report: {
    overall_score: number;
    category_scores: Record<string, number>;
    strengths: string[];
    weaknesses: string[];
    improvement_areas: string[];
    hiring_recommendation: string;
    question_reviews?: QuestionReview[];
  };
  overall_score: number;
  hiring_recommendation: string;
  pdf_url: string | null;
  behavior_summary?: AggregateBehavior | null;
}

export default function InterviewResultPage() {
  const params = useParams<{ id: string }>();
  const interviewId = params.id;
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!interviewId) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 40;

    async function fetchReport() {
      try {
        const data = await api<ReportData>(`/interviews/${interviewId}/report`);
        if (!cancelled) {
          setReport(data);
          setLoading(false);
        }
      } catch {
        attempts += 1;
        if (!cancelled && attempts < maxAttempts) {
          setTimeout(fetchReport, 3000);
        } else if (!cancelled) {
          setReport(null);
          setLoading(false);
        }
      }
    }

    fetchReport();

    return () => {
      cancelled = true;
    };
  }, [interviewId]);

  async function downloadPdf() {
    const res = await fetch(`${API_URL}/interviews/${interviewId}/report/pdf`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-report-${interviewId}.pdf`;
    a.click();
  }

  const questionReviews = report?.report?.question_reviews ?? [];

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-white">Interview Results</h1>
        </div>

        {loading ? (
          <Card><CardContent className="py-12 text-center text-slate-400">Generating your full score summary...</CardContent></Card>
        ) : !report ? (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-slate-400">Report not available yet. It may still be generating.</p>
              <Button
                variant="outline"
                onClick={async () => {
                  setLoading(true);
                  try {
                    const data = await api<ReportData>(`/interviews/${interviewId}/report/regenerate`, { method: "POST" });
                    setReport(data);
                  } catch {
                    setReport(null);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Regenerate Report
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border-emerald-500/30">
              <CardContent className="pt-6 text-center">
                <Award className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
                <p className="text-5xl font-bold text-white mb-2">{formatScore(report.overall_score)}</p>
                <p className="text-slate-400 capitalize">
                  Overall · Recommendation: {report.hiring_recommendation.replace(/_/g, " ")}
                </p>
                <Button onClick={downloadPdf} className="mt-4 gap-2" variant="outline">
                  <Download className="h-4 w-4" /> Download PDF
                </Button>
              </CardContent>
            </Card>

            {report.behavior_summary && (
              <AggregateBehaviorCard summary={report.behavior_summary} />
            )}

            {questionReviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Question-by-Question Review</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {questionReviews.map((review) => (
                    <QuestionReviewCard key={review.sequence} review={review} interviewId={interviewId!} />
                  ))}
                </CardContent>
              </Card>
            )}

            {Object.keys(report.report.category_scores || {}).length > 0 && (
              <Card>
                <CardHeader><CardTitle>Category Scores</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  {Object.entries(report.report.category_scores).map(([cat, score]) => (
                    <div key={cat} className="p-3 rounded-lg bg-slate-900/50">
                      <p className="text-sm text-slate-400 capitalize">{cat.replace(/_/g, " ")}</p>
                      <p className="text-xl font-bold text-white">{formatScore(score)}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-emerald-400">Overall Strengths</CardTitle></CardHeader>
                <CardContent>
                  <ul className="text-sm text-slate-300 space-y-1 list-disc pl-4">
                    {(report.report.strengths || []).map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-amber-400">Areas to Improve</CardTitle></CardHeader>
                <CardContent>
                  <ul className="text-sm text-slate-300 space-y-1 list-disc pl-4">
                    {(report.report.improvement_areas || report.report.weaknesses || []).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
