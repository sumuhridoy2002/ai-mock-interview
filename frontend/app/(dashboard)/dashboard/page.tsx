"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, TrendingUp, Award, ArrowRight, Bell, BellOff, Calendar, Pencil, Trash2, X, Check, TrendingDown, Minus, Star, Target, BarChart2, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHero, StatTile, CategoryHeading } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SystemHealthPanel } from "@/components/system/system-health-panel";
import { useSystemMetrics } from "@/hooks/useSystemMetrics";
import { api } from "@/lib/api";
import { formatScore } from "@/lib/utils";
import { computeAverage, letterGrade, scoreBandColor, scoreBarColor, trendDelta as computeTrendDelta } from "@/lib/scoring/interview";

interface InterviewRow {
  id: number;
  job_title: string;
  status: string;
  experience_level: string;
  interview_type: string;
  created_at: string;
  scheduled_at?: string | null;
  alarm_message?: string | null;
  alarm_triggered_at?: string | null;
  report?: { overall_score: number; hiring_recommendation: string };
}

interface ScheduledRow {
  id: number;
  job_title: string;
  status: string;
  scheduled_at: string;
  alarm_message: string | null;
  alarm_triggered_at: string | null;
}

function scheduleStatus(row: ScheduledRow): "due" | "upcoming" {
  return new Date(row.scheduled_at) <= new Date() ? "due" : "upcoming";
}

const TYPE_META: Record<string, { label: string; border: string }> = {
  technical: { label: "Technical", border: "border-l-indigo-500" },
  behavioral: { label: "Behavioral", border: "border-l-emerald-500" },
  mixed: { label: "Mixed", border: "border-l-violet-500" },
};

function formatScheduledAt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface EditScheduleFormProps {
  row: ScheduledRow;
  onSave: (scheduledAt: string, alarmMessage: string) => Promise<void>;
  onClear: () => Promise<void>;
  onCancel: () => void;
}

/** Format a Date as YYYY-MM-DDTHH:mm in the browser's LOCAL timezone
 *  (required for datetime-local inputs, which always operate in local time). */
function toLocalDatetimeInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function EditScheduleForm({ row, onSave, onClear, onCancel }: EditScheduleFormProps) {
  const minDatetime = toLocalDatetimeInput(new Date(Date.now() + 60_000));
  const currentValue = toLocalDatetimeInput(new Date(row.scheduled_at));

  const [scheduledAt, setScheduledAt] = useState(
    new Date(row.scheduled_at) > new Date() ? currentValue : minDatetime
  );
  const [alarmMessage, setAlarmMessage] = useState(row.alarm_message ?? "");
  const [saving, setSaving] = useState(false);

  const [timeError, setTimeError] = useState("");

  async function handleSave() {
    const picked = new Date(scheduledAt);
    if (isNaN(picked.getTime()) || picked.getTime() <= Date.now() + 30_000) {
      setTimeError("Scheduled time must be at least 1 minute from now.");
      return;
    }
    setTimeError("");
    setSaving(true);
    try {
      await onSave(picked.toISOString(), alarmMessage);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 p-3 rounded-lg border border-indigo-500/30 bg-indigo-500/5 space-y-3">
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Date &amp; Time</label>
        <input
          type="datetime-local"
          value={scheduledAt}
          min={minDatetime}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="w-full h-9 rounded-lg border border-border bg-background px-2 text-foreground text-sm"
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Alarm Message</label>
        <Input
          value={alarmMessage}
          onChange={(e) => setAlarmMessage(e.target.value)}
          placeholder={`Time for your ${row.job_title} interview.`}
          className="h-9 text-sm"
          maxLength={500}
        />
      </div>
      {timeError && (
        <p className="text-xs text-red-400">{timeError}</p>
      )}
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving || !scheduledAt} className="gap-1">
          <Check className="h-3.5 w-3.5" /> Save
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} className="gap-1">
          <X className="h-3.5 w-3.5" /> Cancel
        </Button>
        <button
          onClick={onClear}
          className="ml-auto text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
          title="Remove schedule"
        >
          <Trash2 className="h-3.5 w-3.5" /> Remove schedule
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { metrics: systemMetrics } = useSystemMetrics();
  const [interviews, setInterviews] = useState<InterviewRow[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledRow[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [resumingId, setResumingId] = useState<number | null>(null);

  const loadScheduled = useCallback(() => {
    api<ScheduledRow[]>("/interviews/scheduled")
      .then((rows) => setScheduled(Array.isArray(rows) ? rows : []))
      .catch(() => setScheduled([]));
  }, []);

  useEffect(() => {
    api<{ data: InterviewRow[] }>("/interviews")
      .then((res) => setInterviews(res.data || []))
      .catch(() => setInterviews([]));

    loadScheduled();
  }, [loadScheduled]);

  const completed = interviews.filter((i) => i.status === "completed");
  const avgScore = computeAverage(completed.map((i) => i.report?.overall_score || 0).filter((s) => s > 0));

  // ── Progress metrics ──────────────────────────────────────────────────────
  const withScore = completed.filter((i) => i.report?.overall_score != null);
  const sortedByDate = [...withScore].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const recent8 = sortedByDate.slice(-8);

  const trendDelta = computeTrendDelta(recent8.map((i) => i.report?.overall_score ?? 0));

  const bestScore = withScore.length
    ? Math.max(...withScore.map((i) => i.report!.overall_score))
    : 0;

  // Score by interview type
  const byType = ["technical", "behavioral", "mixed"].map((type) => {
    const rows = withScore.filter((i) => i.interview_type === type);
    const avg = rows.length
      ? Math.round(rows.reduce((s, i) => s + i.report!.overall_score, 0) / rows.length)
      : null;
    return { type, count: rows.length, avg };
  });

  const grade = letterGrade(avgScore);
  const gradeColor = scoreBandColor(avgScore);

  async function handleSaveSchedule(row: ScheduledRow, scheduledAt: string, alarmMessage: string) {
    await api(`/interviews/${row.id}/schedule`, {
      method: "PATCH",
      body: JSON.stringify({ scheduled_at: scheduledAt, alarm_message: alarmMessage }),
    });
    setEditingId(null);
    loadScheduled();
  }

  async function handleClearSchedule(row: ScheduledRow) {
    await api(`/interviews/${row.id}/clear-schedule`, { method: "POST" });
    setEditingId(null);
    loadScheduled();
  }

  async function handleStartScheduled(row: ScheduledRow) {
    const session = await api<{ session_uuid: string }>(`/interviews/${row.id}/start`, {
      method: "POST",
    });
    window.location.href = `/interview/live/${session.session_uuid}?interviewId=${row.id}`;
  }

  async function handleResumeInterview(interview: InterviewRow) {
    if (resumingId) return;
    setResumingId(interview.id);
    try {
      const session = await api<{ session_uuid: string }>(`/interviews/${interview.id}/start`, {
        method: "POST",
      });
      router.push(`/interview/live/${session.session_uuid}?interviewId=${interview.id}`);
    } catch {
      setResumingId(null);
    }
  }

  return (
    <AppShell>
      <div className="w-full space-y-6">
        <PageHero
          icon={BarChart2}
          title="Dashboard"
          subtitle="Track interview progress, scheduled sessions, and score trends."
          accent="indigo"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatTile icon={Mic} label="Total Interviews" value={interviews.length} accent="indigo" />
          <StatTile icon={TrendingUp} label="Average Score" value={formatScore(avgScore)} accent="emerald" />
          <StatTile icon={Award} label="Completed" value={completed.length} accent="amber" />
        </div>

        {/* System Health */}
        <SystemHealthPanel metrics={systemMetrics} variant="dashboard" />

        {/* Progress Overview */}
        {completed.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Overall grade + trend */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Star className="h-4 w-4 text-amber-400" />
                  Overall Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Grade ring */}
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor"
                        className="text-muted" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.9" fill="none"
                        stroke="currentColor"
                        className={avgScore >= 85 ? "text-emerald-400" : avgScore >= 70 ? "text-indigo-400" : avgScore >= 55 ? "text-amber-400" : "text-red-400"}
                        strokeWidth="3"
                        strokeDasharray={`${avgScore} 100`}
                        strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-2xl font-bold ${gradeColor}`}>{grade}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-foreground">{avgScore}<span className="text-sm text-muted-foreground font-normal">/100</span></p>
                    <p className="text-xs text-muted-foreground">Avg score</p>
                    <div className="flex items-center gap-1 text-xs">
                      {trendDelta > 0 ? (
                        <><TrendingUp className="h-3.5 w-3.5 text-emerald-400" /><span className="text-emerald-400">+{trendDelta} improving</span></>
                      ) : trendDelta < 0 ? (
                        <><TrendingDown className="h-3.5 w-3.5 text-red-400" /><span className="text-red-400">{trendDelta} declining</span></>
                      ) : (
                        <><Minus className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-muted-foreground">Stable</span></>
                      )}
                    </div>
                  </div>
                </div>

                {/* Best score */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Target className="h-3.5 w-3.5" /> Best score
                  </div>
                  <span className="text-sm font-semibold text-emerald-400">{bestScore}/100</span>
                </div>

                {/* Completion rate */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Completion rate</span>
                    <span>{interviews.length > 0 ? Math.round((completed.length / interviews.length) * 100) : 0}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                      style={{ width: `${interviews.length > 0 ? (completed.length / interviews.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Score history bars */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart2 className="h-4 w-4 text-indigo-400" />
                  Score History
                  <span className="ml-auto text-xs font-normal text-muted-foreground">Last {recent8.length} sessions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recent8.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Complete interviews to see your score history.</p>
                ) : (
                  <div className="space-y-3">
                    {recent8.map((interview, idx) => {
                      const score = interview.report!.overall_score;
                      return (
                        <Link
                          key={interview.id}
                          href={`/interview/result/${interview.id}`}
                          className="flex items-center gap-3 group"
                        >
                          <span className="text-xs text-muted-foreground w-4 shrink-0">#{idx + 1}</span>
                          <span className="text-xs text-foreground/80 truncate w-36 shrink-0 group-hover:text-foreground transition-colors">
                            {interview.job_title}
                          </span>
                          <div className="flex-1 h-5 rounded-md bg-muted overflow-hidden relative border border-border/60">
                            <div
                              className={`h-full rounded-sm ${scoreBarColor(score)} transition-all duration-700`}
                              style={{ width: `${score}%` }}
                            />
                            <span className="absolute inset-0 flex items-center pl-2 text-xs font-semibold text-foreground/80">
                              {score}
                            </span>
                          </div>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-muted-foreground shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Score by type */}
                {byType.some((t) => t.avg !== null) && (
                  <div className="mt-5 pt-4 border-t border-border">
                    <CategoryHeading>Score by type</CategoryHeading>
                    <div className="grid grid-cols-3 gap-3">
                      {byType.map(({ type, count, avg }) => (
                        <div
                          key={type}
                          className={`rounded-xl border border-border border-l-4 bg-card p-3 text-center shadow-sm ${TYPE_META[type].border}`}
                        >
                          <p className="text-xs text-muted-foreground mb-1">{TYPE_META[type].label}</p>
                          <p className={`text-lg font-bold ${avg !== null ? scoreBandColor(avg) : "text-muted-foreground/40"}`}>
                            {avg !== null ? avg : "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">{count} session{count !== 1 ? "s" : ""}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Scheduled Interviews */}
        {scheduled.length > 0 && (
          <Card className="border-indigo-500/30">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-indigo-400" />
                Scheduled Interviews
              </CardTitle>
              <span className="text-xs text-muted-foreground">{scheduled.length} upcoming</span>
            </CardHeader>
            <CardContent className="space-y-3">
              {scheduled.map((row) => {
                const st = scheduleStatus(row);
                const editing = editingId === row.id;

                return (
                  <div
                    key={row.id}
                    className={`rounded-lg border p-4 transition-colors ${
                      st === "due"
                        ? "border-amber-500/40 bg-amber-500/5"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{row.job_title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                              st === "due"
                                ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                                : "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300"
                            }`}
                          >
                            <Calendar className="h-3 w-3" />
                            {st === "due" ? "Due now" : "Scheduled"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatScheduledAt(row.scheduled_at)}
                          </span>
                          {row.alarm_triggered_at && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <BellOff className="h-3 w-3" /> Alarm fired
                            </span>
                          )}
                        </div>
                        {row.alarm_message && (
                          <p className="text-xs text-muted-foreground mt-1 truncate max-w-sm">
                            &ldquo;{row.alarm_message}&rdquo;
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {st === "due" && (
                          <Button
                            size="sm"
                            onClick={() => handleStartScheduled(row)}
                            className="bg-amber-500 hover:bg-amber-600 text-black text-xs h-8 px-3"
                          >
                            Start
                          </Button>
                        )}
                        <button
                          onClick={() => setEditingId(editing ? null : row.id)}
                          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Edit schedule"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {editing && (
                      <EditScheduleForm
                        row={row}
                        onSave={(at, msg) => handleSaveSchedule(row, at, msg)}
                        onClear={() => handleClearSchedule(row)}
                        onCancel={() => setEditingId(null)}
                      />
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Recent Interviews */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Interviews</CardTitle>
            <Link href="/interview/setup">
              <Button size="sm" className="gap-2">
                New Interview <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {interviews.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No interviews yet. Upload a resume and start practicing!
              </p>
            ) : (
              <div className="space-y-3">
                {interviews.map((interview) => {
                  const isActive = interview.status === "active";
                  const isCompleted = interview.status === "completed";
                  const isResuming = resumingId === interview.id;

                  const inner = (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">{interview.job_title}</p>
                        <p className="text-sm text-muted-foreground capitalize flex items-center gap-2 flex-wrap">
                          {interview.experience_level} · {interview.interview_type}
                          {isActive && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                              In progress
                            </span>
                          )}
                          {interview.scheduled_at && !isCompleted && (
                            <span className="inline-flex items-center gap-1 text-indigo-400 text-xs">
                              <Bell className="h-3 w-3" />
                              {formatScheduledAt(interview.scheduled_at)}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-3">
                        {interview.report && (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatScore(interview.report.overall_score)}
                          </span>
                        )}
                        {isActive && (
                          <span className="text-xs font-semibold text-amber-800 bg-amber-500/15 border border-amber-500/30 rounded-full px-2.5 py-0.5 dark:text-amber-300">
                            {isResuming ? "Resuming…" : "Resume →"}
                          </span>
                        )}
                        {!isActive && !isCompleted && (
                          <span className="text-xs text-muted-foreground">Setup</span>
                        )}
                      </div>
                    </>
                  );

                  if (isActive) {
                    return (
                      <button
                        key={interview.id}
                        onClick={() => void handleResumeInterview(interview)}
                        disabled={isResuming}
                        className="w-full flex items-center justify-between p-4 rounded-lg border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-colors text-left disabled:opacity-60"
                      >
                        {inner}
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={interview.id}
                      href={isCompleted ? `/interview/result/${interview.id}` : `/interview/setup`}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      {inner}
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
