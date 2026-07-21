"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchShareDossier, publicResumeFileUrl, type ShareDossier } from "@/lib/public-profiles";
import { formatScore } from "@/lib/utils";

export default function SharePage() {
  const params = useParams();
  const token = String(params.token);
  const [share, setShare] = useState<ShareDossier | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShareDossier(token)
      .then(setShare)
      .catch((err) => setError(err instanceof Error ? err.message : "Invalid share link."))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <span className="font-semibold text-sm">Shared candidate profile</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-10 space-y-6" data-page-export-root>
        {loading ? (
          <p className="text-muted-foreground">Loading profile…</p>
        ) : error || !share ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              {error || "Share link is invalid or expired."}
            </CardContent>
          </Card>
        ) : (
          <>
            <div>
              <p className="text-sm text-muted-foreground">{share.label || "Shared profile"}</p>
              <h1 className="text-3xl font-bold mt-1">{share.candidate.name}</h1>
              {share.candidate.headline && (
                <p className="mt-2 text-muted-foreground">{share.candidate.headline}</p>
              )}
            </div>

            {share.includes_scores && share.scores && (
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Average score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {share.scores.average_score != null
                        ? formatScore(share.scores.average_score)
                        : "—"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Completed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{share.scores.completed_count}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {share.includes_scores && share.skills && share.skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {share.skills.map((skill) => (
                      <span key={skill} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {share.includes_reports && share.interviews && share.interviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Interview reports</CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-border">
                  {share.interviews.map((interview) => (
                    <div key={interview.id} className="py-3 first:pt-0 last:pb-0">
                      <p className="font-medium">{interview.job_title}</p>
                      <p className="text-sm text-muted-foreground">
                        {interview.interview_type}
                        {interview.overall_score != null && ` · ${formatScore(interview.overall_score)}`}
                        {interview.hiring_recommendation &&
                          ` · ${interview.hiring_recommendation.replace(/_/g, " ")}`}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {share.includes_cv && share.resumes && share.resumes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Resumes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {share.resumes.map((resume) => (
                    <a
                      key={resume.id}
                      href={publicResumeFileUrl(token, resume.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/40"
                    >
                      <span className="text-sm font-medium">{resume.original_filename}</span>
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </a>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
