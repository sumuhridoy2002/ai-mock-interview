"use client";

import { useRouter } from "next/navigation";
import { Bell, X, Play, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FiredAlarm } from "@/hooks/useScheduledInterviewAlarm";
import { api } from "@/lib/api";

interface AlarmBannerProps {
  alarms: FiredAlarm[];
  /** Stop ringing + mark triggered + remove from list */
  onStop: (id: number) => void;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AlarmBanner({ alarms, onStop }: AlarmBannerProps) {
  const router = useRouter();

  if (alarms.length === 0) return null;

  async function startInterview(alarm: FiredAlarm) {
    // Stop alarm first so the sound cuts immediately
    onStop(alarm.interview.id);
    try {
      const session = await api<{ session_uuid: string }>(
        `/interviews/${alarm.interview.id}/start`,
        { method: "POST" }
      );
      router.push(
        `/interview/live/${session.session_uuid}?interviewId=${alarm.interview.id}`
      );
    } catch {
      // Navigation failed; alarm already stopped
    }
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 w-full max-w-lg px-4 pointer-events-none">
      {alarms.map((alarm) => (
        <div
          key={alarm.interview.id}
          className="pointer-events-auto rounded-xl border-2 border-amber-500/70 bg-slate-950/98 backdrop-blur-md shadow-2xl shadow-amber-900/40 overflow-hidden"
        >
          {/* Animated top bar */}
          <div className="h-1.5 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 bg-[length:200%_100%] animate-[shimmer_1.5s_linear_infinite]" />

          <div className="p-5">
            <div className="flex items-start gap-3">
              {/* Pulsing bell */}
              <div className="relative shrink-0 mt-0.5">
                <div className="absolute inset-0 rounded-full bg-amber-500/30 animate-ping" />
                <div className="relative p-2.5 rounded-full bg-amber-500/20 border border-amber-500/40">
                  <Bell className="h-5 w-5 text-amber-400" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-400 animate-pulse">
                    ⚡ Interview Alarm
                  </span>
                </div>
                <p className="font-bold text-white text-base leading-tight truncate">
                  {alarm.interview.job_title}
                </p>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
                  <Clock className="h-3 w-3 shrink-0" />
                  Scheduled for {formatTime(alarm.interview.scheduled_at)}
                </div>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed line-clamp-3">
                  {alarm.spokenText}
                </p>
              </div>

              <button
                onClick={() => onStop(alarm.interview.id)}
                className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-slate-700 transition-colors shrink-0"
                aria-label="Dismiss alarm"
                title="Dismiss (stops alarm)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Reminder that it keeps ringing */}
            <p className="text-sm text-slate-500 mt-3 mb-3 flex items-center gap-1">
              <Bell className="h-3 w-3 inline" />
              Alarm repeats every minute until you start or dismiss.
            </p>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => startInterview(alarm)}
                className="gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold flex-1"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                Start Interview Now
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStop(alarm.interview.id)}
                className="border-slate-600 text-slate-300 hover:text-white hover:border-slate-400"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
