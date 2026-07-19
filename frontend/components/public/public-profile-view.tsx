"use client";

import Link from "next/link";
import {
  Award,
  Briefcase,
  Calendar,
  FileText,
  GraduationCap,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PublicProfile } from "@/lib/public-profiles";
import { formatScore, cn } from "@/lib/utils";
import {
  letterGrade,
  hiringLabel,
  scoreBandColor,
  scoreBarColor,
} from "@/lib/scoring/interview";

const TYPE_LABELS: Record<string, string> = {
  technical: "Technical",
  behavioral: "Behavioral",
  mixed: "Mixed",
};

const LEVEL_LABELS: Record<string, string> = {
  junior: "Junior",
  mid: "Mid-level",
  senior: "Senior",
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function recommendationTone(rec?: string): string {
  if (!rec) return "text-muted-foreground";
  if (rec.includes("yes")) return "text-emerald-600 dark:text-emerald-400";
  if (rec === "maybe") return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

interface PublicProfileViewProps {
  profile: PublicProfile;
  showCta?: boolean;
}

export function PublicProfileView({ profile, showCta = true }: PublicProfileViewProps) {
  const grade = letterGrade(profile.average_score ?? 0);
  const gradeColor = scoreBandColor(profile.average_score ?? 0);
  const hasCv = Boolean(profile.cv);
  const hasInterviews = profile.interviews.length > 0;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-background p-6 sm:p-8">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xl font-bold text-white shadow-lg shadow-indigo-500/25">
              {initials(profile.name)}
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{profile.name}</h1>
              {profile.headline && (
                <p className="mt-2 text-lg text-muted-foreground">{profile.headline}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {profile.cv?.experience_years ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4" />
                    {profile.cv.experience_years}+ years experience
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Member since {formatDate(profile.member_since)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-border/80 bg-card/80 px-5 py-4 backdrop-blur-sm">
            <div className="text-center">
              <p className={cn("text-4xl font-bold", gradeColor)}>{grade}</p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Grade</p>
            </div>
            <div className="h-12 w-px bg-border" />
            <div>
              <p className={cn("text-3xl font-bold", gradeColor)}>
                {profile.average_score != null ? formatScore(profile.average_score) : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Average score</p>
            </div>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatPill icon={Trophy} label="Best score" value={profile.performance.best_score != null ? formatScore(profile.performance.best_score) : "—"} />
          <StatPill icon={Target} label="Completed" value={String(profile.completed_count)} />
          <StatPill icon={TrendingUp} label="Total sessions" value={String(profile.interview_count)} />
          <StatPill icon={Star} label="Skills listed" value={String(profile.skills.length)} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — CV + skills */}
        <div className="space-y-6 lg:col-span-2">
          {/* CV Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-indigo-500" />
                Resume & background
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {!hasCv ? (
                <p className="text-sm text-muted-foreground">
                  No parsed resume available yet. Skills and experience will appear here once a CV is uploaded and processed.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3">
                    <div>
                      <p className="font-medium">{profile.cv!.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        Parsed {formatDate(profile.cv!.updated_at)}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      Verified upload
                    </span>
                  </div>

                  {profile.cv!.summary && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Professional summary
                      </p>
                      <p className="text-sm leading-relaxed text-foreground">{profile.cv!.summary}</p>
                    </div>
                  )}

                  {profile.cv!.education.length > 0 && (
                    <div>
                      <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <GraduationCap className="h-4 w-4" /> Education
                      </p>
                      <ul className="space-y-2">
                        {profile.cv!.education.map((item) => (
                          <li
                            key={item}
                            className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {profile.cv!.projects.length > 0 && (
                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Projects & highlights
                      </p>
                      <ul className="space-y-2">
                        {profile.cv!.projects.map((project) => (
                          <li
                            key={project}
                            className="rounded-lg border border-border/60 px-3 py-2 text-sm"
                          >
                            {project}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Interview history */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="h-5 w-5 text-violet-500" />
                Interview history
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!hasInterviews ? (
                <p className="text-sm text-muted-foreground">No completed mock interviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {profile.interviews.map((interview) => (
                    <div
                      key={interview.id}
                      className="rounded-xl border border-border p-4 transition-colors hover:bg-muted/20"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{interview.job_title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {TYPE_LABELS[interview.interview_type] ?? interview.interview_type}
                            {" · "}
                            {LEVEL_LABELS[interview.experience_level] ?? interview.experience_level}
                            {" · "}
                            {formatDate(interview.created_at)}
                          </p>
                          {interview.hiring_recommendation && (
                            <p className={cn("mt-1 text-xs font-medium capitalize", recommendationTone(interview.hiring_recommendation))}>
                              {hiringLabel(interview.hiring_recommendation)}
                            </p>
                          )}
                        </div>
                        {interview.overall_score != null && (
                          <div className="text-right">
                            <p className={cn("text-2xl font-bold", scoreBandColor(interview.overall_score))}>
                              {formatScore(interview.overall_score)}
                            </p>
                          </div>
                        )}
                      </div>

                      {interview.overall_score != null && (
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn("h-full rounded-full transition-all", scoreBarColor(interview.overall_score))}
                            style={{ width: `${Math.min(interview.overall_score, 100)}%` }}
                          />
                        </div>
                      )}

                      {interview.strengths && interview.strengths.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {interview.strengths.slice(0, 3).map((s) => (
                            <span
                              key={s}
                              className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-700 dark:text-emerald-300"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column — performance + skills */}
        <div className="space-y-6">
          {/* Skills */}
          {profile.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Core skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-gradient-to-r from-indigo-500/10 to-violet-500/10 px-3 py-1.5 text-xs font-medium ring-1 ring-indigo-500/20"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance by type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance by type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(profile.performance.by_type).map(([type, data]) => (
                <div key={type}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium">{TYPE_LABELS[type] ?? type}</span>
                    <span className="text-muted-foreground">
                      {data.count > 0 && data.average_score != null
                        ? `${formatScore(data.average_score)} · ${data.count} session${data.count === 1 ? "" : "s"}`
                        : "No data"}
                    </span>
                  </div>
                  {data.average_score != null && (
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full", scoreBarColor(data.average_score))}
                        style={{ width: `${Math.min(data.average_score, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Strengths */}
          {profile.performance.top_strengths.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Star className="h-4 w-4 text-amber-500" />
                  Top strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {profile.performance.top_strengths.map((item) => (
                    <li key={item} className="flex gap-2 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Improvement areas */}
          {profile.performance.improvement_areas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4 text-indigo-500" />
                  Growth areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {profile.performance.improvement_areas.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {showCta && (
        <div className="rounded-2xl border border-dashed border-indigo-500/30 bg-indigo-500/5 px-6 py-8 text-center">
          <p className="text-lg font-semibold">Want to practice like {profile.name.split(" ")[0]}?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Join Mock Interview Pro for AI-powered mock interviews with real-time scoring.
          </p>
          <Link href="/register" className="mt-4 inline-block">
            <Button size="lg">Start your mock interviews</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/60 px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
