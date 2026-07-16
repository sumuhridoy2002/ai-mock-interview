import { Eye, Brain, Activity } from "lucide-react";
import { toPercent, clampBar, sortEmotions } from "@/lib/scoring/behavior";

export interface BehaviorData {
  confidence: number;
  nervousness: number;
  eye_contact_ratio: number;
  head_stability: number;
  blink_rate: number;
  emotion_distribution?: Record<string, number>;
  coaching_narrative?: string | null;
}

export interface AggregateBehavior {
  avg_confidence: number;
  avg_nervousness: number;
  avg_eye_contact: number;
  avg_head_stability: number;
  avg_blink_rate: number;
  emotion_distribution?: Record<string, number>;
  coaching_narrative?: string;
  suggestions?: string[];
  questions_analyzed: number;
  snapshots_analyzed?: number;
  frames_analyzed?: number;
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full bg-muted rounded-full h-1.5 mt-1">
      <div
        className={`h-1.5 rounded-full ${color}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function EmotionBadge({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  const colors: Record<string, string> = {
    happy: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    neutral: "bg-muted text-muted-foreground",
    surprised: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    fearful: "bg-red-500/15 text-red-700 dark:text-red-300",
    sad: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
    angry: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
    disgusted: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  };
  const cls = colors[label.toLowerCase()] ?? "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-medium ${cls}`}>
      {label} {pct}%
    </span>
  );
}

/** Per-answer behavior panel shown inside QuestionReviewCard */
export function BehaviorPanel({ behavior }: { behavior: BehaviorData }) {
  const emotions = sortEmotions(behavior.emotion_distribution ?? {}).slice(0, 4);

  return (
    <div className="rounded-md bg-muted/40 border border-border p-3 space-y-3">
      <p className="text-xs text-purple-700 dark:text-purple-300 font-medium flex items-center gap-1">
        <Brain className="h-3 w-3" /> Body Language Analysis
      </p>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
        <div>
          <p className="text-muted-foreground flex justify-between">
            <span>Confidence</span>
            <span className="text-foreground font-semibold">{behavior.confidence}/100</span>
          </p>
          <ScoreBar value={behavior.confidence} color="bg-emerald-500" />
        </div>
        <div>
          <p className="text-muted-foreground flex justify-between">
            <span>Nervousness</span>
            <span className="text-foreground font-semibold">{behavior.nervousness}/100</span>
          </p>
          <ScoreBar value={behavior.nervousness} color="bg-red-400" />
        </div>
        <div>
          <p className="text-muted-foreground flex justify-between">
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> Eye contact</span>
            <span className="text-foreground font-semibold">{Math.round(toPercent(behavior.eye_contact_ratio))}%</span>
          </p>
          <ScoreBar value={clampBar(behavior.eye_contact_ratio * 100)} color="bg-blue-400" />
        </div>
        <div>
          <p className="text-muted-foreground flex justify-between">
            <span>Head stability</span>
            <span className="text-foreground font-semibold">{Math.round(toPercent(behavior.head_stability))}%</span>
          </p>
          <ScoreBar value={clampBar(behavior.head_stability * 100)} color="bg-indigo-400" />
        </div>
      </div>

      {emotions.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Detected emotions</p>
          <div className="flex flex-wrap gap-1">
            {emotions.map(([label, val]) => (
              <EmotionBadge key={label} label={label} value={val} />
            ))}
          </div>
        </div>
      )}

      {behavior.coaching_narrative && (
        <div className="rounded-md bg-purple-500/10 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-500/20 p-2.5">
          <p className="text-xs text-purple-700 dark:text-purple-300 uppercase tracking-wide mb-1 font-medium">
            Coaching note
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">{behavior.coaching_narrative}</p>
        </div>
      )}
    </div>
  );
}

/** Aggregate behavior summary card for the full interview result page */
export function AggregateBehaviorCard({ summary }: { summary: AggregateBehavior }) {
  const emotions = Object.entries(summary.emotion_distribution ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="rounded-lg border border-purple-200 dark:border-purple-500/30 bg-purple-50/60 dark:bg-purple-950/10 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        <h3 className="text-foreground font-semibold">Body Language & Presence</h3>
        <span className="text-xs text-muted-foreground ml-auto">
          {summary.snapshots_analyzed
            ? `${summary.snapshots_analyzed} snapshots`
            : `${summary.questions_analyzed} answer${summary.questions_analyzed !== 1 ? "s" : ""}`}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Avg Confidence", value: summary.avg_confidence, color: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500" },
          { label: "Avg Nervousness", value: summary.avg_nervousness, color: "text-red-600 dark:text-red-400", bar: "bg-red-400" },
          { label: "Eye Contact", value: Math.round(summary.avg_eye_contact * 100), color: "text-blue-600 dark:text-blue-400", bar: "bg-blue-400" },
          { label: "Head Stability", value: Math.round(summary.avg_head_stability * 100), color: "text-indigo-600 dark:text-indigo-400", bar: "bg-indigo-400" },
        ].map(({ label, value, color, bar }) => (
          <div key={label} className="rounded-md bg-card border border-border px-3 py-2 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <ScoreBar value={value} color={bar} />
          </div>
        ))}
      </div>

      {emotions.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Dominant emotions across interview</p>
          <div className="flex flex-wrap gap-1.5">
            {emotions.map(([label, val]) => (
              <EmotionBadge key={label} label={label} value={val} />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
        <p>Blink rate: <span className="text-foreground font-medium">{summary.avg_blink_rate} bpm</span> <span className="text-muted-foreground/70">(normal 12–20)</span></p>
        {summary.frames_analyzed ? (
          <p>Frames analysed: <span className="text-foreground font-medium">{summary.frames_analyzed}</span></p>
        ) : null}
      </div>
    </div>
  );
}
