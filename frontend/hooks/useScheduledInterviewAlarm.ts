"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";

export interface ScheduledInterview {
  id: number;
  job_title: string;
  status: string;
  scheduled_at: string;
  alarm_message: string | null;
  alarm_triggered_at: string | null;
}

export interface FiredAlarm {
  interview: ScheduledInterview;
  spokenText: string;
}

/** Poll for due interviews every 30 s */
const POLL_INTERVAL_MS = 30_000;
/** Repeat the alarm sound + speech every 60 s while banner is visible */
const RING_REPEAT_MS = 60_000;

function formatAlarmTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

/** Smart default message – contextual and action-oriented */
export function buildSpokenText(interview: ScheduledInterview): string {
  if (interview.alarm_message) return interview.alarm_message;
  const time = formatAlarmTime(interview.scheduled_at);
  return (
    `Interview reminder! Your ${interview.job_title} session was scheduled for ${time}. ` +
    `It's time to start now. Open Mock Interview Pro and begin your mock interview immediately.`
  );
}

/** Loud, urgent two-tone alarm: 5 rapid double-beeps at full volume */
export function playAlarmTone(): void {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const master = ctx.createGain();
    master.gain.value = 1.0;
    master.connect(ctx.destination);

    let t = ctx.currentTime;

    for (let i = 0; i < 5; i++) {
      // High tone
      const oscH = ctx.createOscillator();
      const gainH = ctx.createGain();
      oscH.connect(gainH);
      gainH.connect(master);
      oscH.type = "square";
      oscH.frequency.value = 1040;
      gainH.gain.setValueAtTime(0, t);
      gainH.gain.linearRampToValueAtTime(0.9, t + 0.015);
      gainH.gain.setValueAtTime(0.9, t + 0.1);
      gainH.gain.linearRampToValueAtTime(0, t + 0.13);
      oscH.start(t);
      oscH.stop(t + 0.14);

      t += 0.17;

      // Low tone
      const oscL = ctx.createOscillator();
      const gainL = ctx.createGain();
      oscL.connect(gainL);
      gainL.connect(master);
      oscL.type = "square";
      oscL.frequency.value = 740;
      gainL.gain.setValueAtTime(0, t);
      gainL.gain.linearRampToValueAtTime(0.9, t + 0.015);
      gainL.gain.setValueAtTime(0.9, t + 0.1);
      gainL.gain.linearRampToValueAtTime(0, t + 0.13);
      oscL.start(t);
      oscL.stop(t + 0.14);

      t += 0.22; // short gap between pairs
    }

    setTimeout(() => ctx.close(), (t + 0.3) * 1000);
  } catch {
    // Web Audio unavailable
  }
}

function speakText(text: string): void {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.88;
    utterance.pitch = 1.1;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Speech synthesis unavailable
  }
}

export function useScheduledInterviewAlarm() {
  const [firedAlarms, setFiredAlarms] = useState<FiredAlarm[]>([]);

  // IDs currently showing in the banner (ringing)
  const ringingIds = useRef<Set<number>>(new Set());
  // Per-alarm repeat interval handles
  const ringIntervals = useRef<Map<number, ReturnType<typeof setInterval>>>(new Map());

  /** Start repeating alarm for an interview that just became due */
  const startRinging = useCallback((interview: ScheduledInterview, spokenText: string) => {
    if (ringingIds.current.has(interview.id)) return;
    ringingIds.current.add(interview.id);

    // Fire immediately
    playAlarmTone();
    setTimeout(() => speakText(spokenText), 1400);

    // Keep ringing every RING_REPEAT_MS until dismissed
    const interval = setInterval(() => {
      playAlarmTone();
      setTimeout(() => speakText(spokenText), 1400);
    }, RING_REPEAT_MS);

    ringIntervals.current.set(interview.id, interval);

    setFiredAlarms((prev) => {
      if (prev.some((a) => a.interview.id === interview.id)) return prev;
      return [...prev, { interview, spokenText }];
    });
  }, []);

  /** Stop the repeating alarm for one interview and mark triggered on server */
  const stopRinging = useCallback((interviewId: number) => {
    ringingIds.current.delete(interviewId);

    const interval = ringIntervals.current.get(interviewId);
    if (interval !== undefined) {
      clearInterval(interval);
      ringIntervals.current.delete(interviewId);
    }

    // Stop speech mid-sentence if still speaking
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }

    // Mark triggered on server so it won't fire again after page reload
    api(`/interviews/${interviewId}/trigger-alarm`, { method: "POST" }).catch(() => {});

    setFiredAlarms((prev) => prev.filter((a) => a.interview.id !== interviewId));
  }, []);

  const checkAlarms = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!getToken()) return;

    try {
      const rows = await api<ScheduledInterview[]>("/interviews/scheduled");
      if (!Array.isArray(rows)) return;

      const now = new Date();

      for (const interview of rows) {
        const isDue =
          interview.alarm_triggered_at === null &&
          new Date(interview.scheduled_at) <= now &&
          interview.status !== "completed";

        if (isDue) {
          startRinging(interview, buildSpokenText(interview));
        }
      }
    } catch {
      // Network error — retry next poll
    }
  }, [startRinging]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    checkAlarms();

    const pollInterval = setInterval(checkAlarms, POLL_INTERVAL_MS);
    const onVisible = () => { if (!document.hidden) checkAlarms(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener("visibilitychange", onVisible);
      // Clean up all ring intervals on unmount
      ringIntervals.current.forEach((id) => clearInterval(id));
      ringIntervals.current.clear();
      ringingIds.current.clear();
    };
  }, [checkAlarms]);

  return { firedAlarms, stopRinging };
}
