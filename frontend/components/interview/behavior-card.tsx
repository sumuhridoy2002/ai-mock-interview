import { Eye, Brain, Activity } from "lucide-react";

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
  questions_analyzed: number;
  snapshots_analyzed?: number;
  frames_analyzed?: number;
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1">
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
    happy: "bg-emerald-500/20 text-emerald-300",
    neutral: "bg-slate-600/40 text-slate-300",
    surprised: "bg-blue-500/20 text-blue-300",
    fearful: "bg-red-500/20 text-red-300",
    sad: "bg-indigo-500/20 text-indigo-300",
    angry: "bg-orange-500/20 text-orange-300",
    disgusted: "bg-yellow-500/20 text-yellow-300",
  };
  const cls = colors[label.toLowerCase()] ?? "bg-slate-700/40 text-slate-300";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${cls}`}>
      {label} {pct}%
    </span>
  );
}

/** Per-answer behavior panel shown inside QuestionReviewCard */
export function BehaviorPanel({ behavior }: { behavior: BehaviorData }) {
  const emotions = Object.entries(behavior.emotion_distribution ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="rounded-md bg-slate-950/50 border border-slate-700/40 p-3 space-y-3">
      <p className="text-xs text-purple-300 font-medium flex items-center gap-1">
        <Brain className="h-3 w-3" /> Body Language Analysis
      </p>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
        {/* Confidence */}
        <div>
          <p className="text-slate-400 flex justify-between">
            <span>Confidence</span>
            <span className="text-white font-semibold">{behavior.confidence}/100</span>
          </p>
          <ScoreBar value={behavior.confidence} color="bg-emerald-500" />
        </div>
        {/* Nervousness */}
        <div>
          <p className="text-slate-400 flex justify-between">
            <span>Nervousness</span>
            <span className="text-white font-semibold">{behavior.nervousness}/100</span>
          </p>
          <ScoreBar value={behavior.nervousness} color="bg-red-400" />
        </div>
        {/* Eye contact */}
        <div>
          <p className="text-slate-400 flex justify-between">
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> Eye contact</span>
            <span className="text-white font-semibold">{Math.round(behavior.eye_contact_ratio * 100)}%</span>
          </p>
          <ScoreBar value={behavior.eye_contact_ratio * 100} color="bg-blue-400" />
        </div>
        {/* Head stability */}
        <div>
          <p className="text-slate-400 flex justify-between">
            <span>Head stability</span>
            <span className="text-white font-semibold">{Math.round(behavior.head_stability * 100)}%</span>
          </p>
          <ScoreBar value={behavior.head_stability * 100} color="bg-indigo-400" />
        </div>
      </div>

      {emotions.length > 0 && (
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Detected emotions</p>
          <div className="flex flex-wrap gap-1">
            {emotions.map(([label, val]) => (
              <EmotionBadge key={label} label={label} value={val} />
            ))}
          </div>
        </div>
      )}

      {behavior.coaching_narrative && (
        <div className="rounded-md bg-purple-950/30 border border-purple-500/20 p-2.5">
          <p className="text-[10px] text-purple-300 uppercase tracking-wide mb-1 font-medium">
            Coaching note
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">{behavior.coaching_narrative}</p>
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
    <div className="rounded-lg border border-purple-500/30 bg-purple-950/10 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-purple-400" />
        <h3 className="text-white font-semibold">Body Language & Presence</h3>
        <span className="text-xs text-slate-500 ml-auto">
          {summary.snapshots_analyzed
            ? `${summary.snapshots_analyzed} snapshots`
            : `${summary.questions_analyzed} answer${summary.questions_analyzed !== 1 ? "s" : ""}`}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Avg Confidence", value: summary.avg_confidence, max: 100, color: "text-emerald-400", bar: "bg-emerald-500" },
          { label: "Avg Nervousness", value: summary.avg_nervousness, max: 100, color: "text-red-400", bar: "bg-red-400" },
          { label: "Eye Contact", value: Math.round(summary.avg_eye_contact * 100), max: 100, color: "text-blue-400", bar: "bg-blue-400" },
          { label: "Head Stability", value: Math.round(summary.avg_head_stability * 100), max: 100, color: "text-indigo-400", bar: "bg-indigo-400" },
        ].map(({ label, value, color, bar }) => (
          <div key={label} className="rounded-md bg-slate-900/50 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <ScoreBar value={value} color={bar} />
          </div>
        ))}
      </div>

      {emotions.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Dominant emotions across interview</p>
          <div className="flex flex-wrap gap-1.5">
            {emotions.map(([label, val]) => (
              <EmotionBadge key={label} label={label} value={val} />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
        <p>Blink rate: <span className="text-white">{summary.avg_blink_rate} bpm</span> <span className="text-slate-600">(normal 12–20)</span></p>
        {summary.frames_analyzed ? (
          <p>Frames analysed: <span className="text-white">{summary.frames_analyzed}</span></p>
        ) : null}
      </div>

      {summary.coaching_narrative && (
        <div className="rounded-md bg-purple-950/30 border border-purple-500/20 p-3">
          <p className="text-[10px] text-purple-300 uppercase tracking-wide mb-1 font-medium">
            Coaching summary
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">{summary.coaching_narrative}</p>
        </div>
      )}
    </div>
  );
}
