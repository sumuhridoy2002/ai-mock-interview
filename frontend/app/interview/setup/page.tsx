"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHero, SectionPanel } from "@/components/ui/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { Mic } from "lucide-react";

interface Resume {
  id: number;
  original_filename: string;
  status: string;
}

type Mode = "now" | "schedule";

export default function InterviewSetupPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resumeId, setResumeId] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("mid");
  const [interviewType, setInterviewType] = useState("mixed");
  const [mode, setMode] = useState<Mode>("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [alarmMessage, setAlarmMessage] = useState("");
  const [alarmMessageEdited, setAlarmMessageEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ data: Resume[] }>("/resumes").then((res) => {
      const parsed = res.data.filter((r) => r.status === "parsed");
      setResumes(parsed);
      if (parsed[0]) setResumeId(String(parsed[0].id));
    });
  }, []);

  // Keep alarm message in sync with job title unless user has manually edited it
  useEffect(() => {
    if (!alarmMessageEdited) {
      setAlarmMessage(
        jobTitle
          ? `Time for your ${jobTitle} interview. Open the app and start now.`
          : ""
      );
    }
  }, [jobTitle, alarmMessageEdited]);

  // datetime-local inputs require LOCAL time strings, not UTC (toISOString gives UTC)
  function toLocalDatetimeInput(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
      `T${pad(date.getHours())}:${pad(date.getMinutes())}`
    );
  }

  const minDatetime = toLocalDatetimeInput(new Date(Date.now() + 60_000));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    // Frontend time validation — must be at least 1 minute in the future
    if (mode === "schedule") {
      if (!scheduledAt) {
        setError("Please pick a date and time for the schedule.");
        return;
      }
      const picked = new Date(scheduledAt);
      if (isNaN(picked.getTime()) || picked.getTime() <= Date.now() + 30_000) {
        setError("Scheduled time must be at least 1 minute from now.");
        return;
      }
    }

    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        resume_id: parseInt(resumeId, 10),
        job_title: jobTitle,
        job_description: jobDescription,
        experience_level: experienceLevel,
        interview_type: interviewType,
      };

      if (mode === "schedule" && scheduledAt) {
        body.scheduled_at = new Date(scheduledAt).toISOString();
        body.alarm_message = alarmMessage || `Time for your ${jobTitle} interview.`;
      }

      const interview = await api<{ id: number; scheduled_at?: string }>("/interviews", {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (mode === "schedule") {
        router.push("/dashboard");
        return;
      }

      const session = await api<{ session_uuid: string }>(`/interviews/${interview.id}/start`, {
        method: "POST",
      });
      router.push(`/interview/live/${session.session_uuid}?interviewId=${interview.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create interview");
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "w-full h-10 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:[color-scheme:dark]";

  const labelClass = "text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5 block";

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHero
          icon={Mic}
          title="Interview Setup"
          subtitle="Configure resume, role, level, and start now or schedule for later."
          accent="indigo"
        />

        <SectionPanel title="Session Details" description="All fields are used to tailor AI questions.">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 p-3 text-sm font-medium text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}

              {/* Resume */}
              <div>
                <label className={labelClass}>Resume</label>
                <select
                  value={resumeId}
                  onChange={(e) => setResumeId(e.target.value)}
                  className={fieldClass}
                  required
                >
                  {resumes.length === 0 && <option value="">Upload a resume first</option>}
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.original_filename}
                    </option>
                  ))}
                </select>
              </div>

              {/* Job Title */}
              <div>
                <label className={labelClass}>Job Title</label>
                <Input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  required
                  placeholder="Senior Laravel Developer"
                  className="font-medium text-slate-900 dark:text-white"
                />
              </div>

              {/* Job Description */}
              <div>
                <label className={labelClass}>Job Description</label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  required
                  rows={5}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Paste the job description..."
                />
              </div>

              {/* Level & Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Experience Level</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className={fieldClass}
                  >
                    <option value="junior">Junior</option>
                    <option value="mid">Mid</option>
                    <option value="senior">Senior</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Interview Type</label>
                  <select
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value)}
                    className={fieldClass}
                  >
                    <option value="technical">Technical</option>
                    <option value="behavioral">Behavioral</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
              </div>

              {/* Mode toggle */}
              <div>
                <label className={labelClass}>When to start?</label>
                <div className="flex rounded-lg border border-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setMode("now")}
                    className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                      mode === "now"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-slate-700 dark:text-slate-300 hover:bg-muted hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Start Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("schedule")}
                    className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                      mode === "schedule"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-slate-700 dark:text-slate-300 hover:bg-muted hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Schedule for Later
                  </button>
                </div>
              </div>

              {/* Schedule fields */}
              {mode === "schedule" && (
                <div className="space-y-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <div>
                    <label className={labelClass}>
                      Date &amp; Time
                      <span className="text-slate-500 dark:text-slate-400 font-normal ml-1">
                        (your local timezone)
                      </span>
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      min={minDatetime}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      required={mode === "schedule"}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      Alarm Message
                      <span className="text-slate-500 dark:text-slate-400 font-normal ml-1">
                        (spoken aloud at alarm time)
                      </span>
                    </label>
                    <Input
                      value={alarmMessage}
                      onChange={(e) => {
                        setAlarmMessageEdited(true);
                        setAlarmMessage(e.target.value);
                      }}
                      placeholder={`Time for your ${jobTitle || "interview"}. Start now.`}
                      maxLength={500}
                      className="font-medium text-slate-900 dark:text-white"
                    />
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 font-medium">
                      Leave blank to use default message.
                    </p>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full font-semibold"
                disabled={loading || resumes.length === 0 || (mode === "schedule" && !scheduledAt)}
              >
                {loading
                  ? mode === "schedule"
                    ? "Scheduling..."
                    : "Starting..."
                  : mode === "schedule"
                  ? "Schedule Interview"
                  : "Start Interview"}
              </Button>
            </form>
        </SectionPanel>
      </div>
    </AppShell>
  );
}
