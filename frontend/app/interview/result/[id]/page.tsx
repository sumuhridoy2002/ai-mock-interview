"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Download, ArrowLeft, Award, Video, Camera, FileText } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuestionReviewCard } from "@/components/interview/question-review-card";
import { AggregateBehaviorCard, type AggregateBehavior } from "@/components/interview/behavior-card";
import { InterviewGallery } from "@/components/interview/interview-gallery";
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
  answer_id?: number;
  snapshot_count?: number;
  snapshot_behavior?: {
    confidence: number;
    nervousness: number;
    eye_contact_ratio: number;
    head_stability: number;
    blink_rate: number;
    emotion_distribution?: Record<string, number>;
    coaching_narrative?: string;
    frame_scores?: Array<{
      face_detected?: boolean;
      confidence?: number;
      nervousness?: number;
      dominant_emotion?: string;
    }>;
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
  recording_url: string | null;
  behavior_summary?: (AggregateBehavior & { by_answer?: Record<string, unknown> }) | null;
}

type Tab = "report" | "gallery";

export default function InterviewResultPage() {
  const params = useParams<{ id: string }>();
  const interviewId = params.id;
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("report");
  const [recordingBlobUrl, setRecordingBlobUrl] = useState<string | null>(null);
  const recordingFetchedRef = useRef(false);

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

  useEffect(() => {
    if (!report?.recording_url || recordingFetchedRef.current) return;
    recordingFetchedRef.current = true;
    fetch(report.recording_url, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.blob())
      .then((blob) => setRecordingBlobUrl(URL.createObjectURL(blob)))
      .catch(() => {});
  }, [report?.recording_url]);

  useEffect(() => {
    return () => {
      if (recordingBlobUrl) URL.revokeObjectURL(recordingBlobUrl);
    };
  }, [recordingBlobUrl]);

  // Poll until post-interview snapshot analysis finishes
  useEffect(() => {
    if (!interviewId || !report) return;
    const hasAnalysis = Boolean(
      report.behavior_summary?.by_answer &&
        Object.keys(report.behavior_summary.by_answer).length > 0
    );
    if (hasAnalysis) return;

    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      if (cancelled || attempts >= 20) return;
      attempts += 1;
      try {
        const data = await api<ReportData>(`/interviews/${interviewId}/report`);
        const ready = Boolean(
          data.behavior_summary?.by_answer &&
            Object.keys(data.behavior_summary.by_answer).length > 0
        );
        if (!cancelled && ready) {
          setReport(data);
          return;
        }
      } catch {
        // keep polling
      }
      if (!cancelled) setTimeout(poll, 4000);
    };

    const timer = setTimeout(poll, 4000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [interviewId, report]);

  const questionReviews = report?.report?.question_reviews ?? [];

  const galleryQuestions = questionReviews
    .filter((r) => r.answer_id)
    .map((r) => ({
      sequence: r.sequence,
      question: r.question,
      answerId: r.answer_id!,
      snapshotCount: r.snapshot_count ?? 0,
      snapshotBehavior: r.snapshot_behavior ?? null,
    }));

  const totalSnaps = galleryQuestions.reduce((s, q) => s + q.snapshotCount, 0);

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
          <Card><CardContent className="py-12 text-center text-slate-400">Generating your full score summary…</CardContent></Card>
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
            {/* Score summary — always visible */}
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

            {/* Tab bar */}
            <div className="flex gap-1 rounded-xl bg-slate-900/60 p-1 border border-slate-800">
              <button
                onClick={() => setActiveTab("report")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === "report"
                    ? "bg-slate-700 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileText className="h-4 w-4" />
                Report
              </button>
              <button
                onClick={() => setActiveTab("gallery")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === "gallery"
                    ? "bg-slate-700 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Camera className="h-4 w-4" />
                Snapshots
                {totalSnaps > 0 && (
                  <span className="ml-1 rounded-full bg-indigo-600/60 px-1.5 py-0.5 text-[10px] text-indigo-200">
                    {totalSnaps}
                  </span>
                )}
              </button>
            </div>

            {/* ── REPORT TAB ── */}
            {activeTab === "report" && (
              <div className="space-y-6">
                {report.recording_url && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Video className="h-5 w-5 text-indigo-400" />
                        Full Interview Recording
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {recordingBlobUrl ? (
                        <video
                          src={recordingBlobUrl}
                          controls
                          playsInline
                          className="w-full rounded-lg bg-black aspect-video"
                          style={{ maxHeight: "480px" }}
                        />
                      ) : (
                        <div className="aspect-video rounded-lg bg-slate-900 flex items-center justify-center">
                          <span className="text-sm text-slate-500 flex items-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-indigo-400" />
                            Loading recording…
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

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
              </div>
            )}

            {/* ── GALLERY TAB ── */}
            {activeTab === "gallery" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-indigo-400" />
                    Captured Snapshots
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <InterviewGallery
                    interviewId={interviewId!}
                    questions={galleryQuestions}
                    overallBehavior={report.behavior_summary ?? null}
                  />
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
