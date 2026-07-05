"use client";

import { createContext, useContext } from "react";
import { useTheme } from "next-themes";
import { JOURNEY_STEPS, RUNTIME_STEPS } from "@/lib/methodology-copy";

/* ─── colours ─────────────────────────────────────────────────────────────── */
const DARK_COLORS = {
  procFill: "#1e1b4b",
  procStroke: "#4f46e5",
  procText: "#e0e7ff",
  procSub: "#a5b4fc",
  diaFill: "#2e1065",
  diaStroke: "#7c3aed",
  diaText: "#ddd6fe",
  pillFill: "#052e16",
  pillStroke: "#10b981",
  pillText: "#34d399",
  pillSub: "#6ee7b7",
  noteFill: "#0c1a2e",
  noteStroke: "#1d4ed8",
  noteText: "#93c5fd",
  noteSub: "#60a5fa",
  browserFill: "#0c1a2e",
  browserStroke: "#1d4ed8",
  aiFill: "#1a0a2e",
  aiStroke: "#9333ea",
  aiText: "#e9d5ff",
  aiSub: "#c084fc",
  memoryFill: "#1a2e05",
  memoryStroke: "#65a30d",
  memoryText: "#bbf7d0",
  memorySub: "#86efac",
  dbFill: "#111827",
  dbStroke: "#374151",
  dbText: "#d1d5db",
  dbSub: "#6b7280",
  wsFill: "#1e0f3a",
  wsStroke: "#7c3aed",
  wsText: "#ddd6fe",
  wsSub: "#a78bfa",
  line: "#4f46e5",
  lineLabel: "#64748b",
  noteLine: "#3b82f6",
  wsLine: "#8b5cf6",
  memoryLine: "#65a30d",
} as const;

const LIGHT_COLORS = {
  procFill: "#eef2ff",
  procStroke: "#6366f1",
  procText: "#1e1b4b",
  procSub: "#4338ca",
  diaFill: "#f5f3ff",
  diaStroke: "#7c3aed",
  diaText: "#4c1d95",
  pillFill: "#ecfdf5",
  pillStroke: "#10b981",
  pillText: "#065f46",
  pillSub: "#047857",
  noteFill: "#eff6ff",
  noteStroke: "#2563eb",
  noteText: "#1e40af",
  noteSub: "#1d4ed8",
  browserFill: "#eff6ff",
  browserStroke: "#2563eb",
  aiFill: "#faf5ff",
  aiStroke: "#9333ea",
  aiText: "#581c87",
  aiSub: "#7e22ce",
  memoryFill: "#f0fdf4",
  memoryStroke: "#16a34a",
  memoryText: "#14532d",
  memorySub: "#15803d",
  dbFill: "#f9fafb",
  dbStroke: "#6b7280",
  dbText: "#374151",
  dbSub: "#4b5563",
  wsFill: "#f5f3ff",
  wsStroke: "#7c3aed",
  wsText: "#5b21b6",
  wsSub: "#6d28d9",
  line: "#6366f1",
  lineLabel: "#475569",
  noteLine: "#2563eb",
  wsLine: "#7c3aed",
  memoryLine: "#16a34a",
} as const;

type DiagramColors = { [K in keyof typeof DARK_COLORS]: string };

const DiagramColorsContext = createContext<DiagramColors>(DARK_COLORS);

function useDiagramColors() {
  return useContext(DiagramColorsContext);
}

const F = "ui-sans-serif,system-ui,sans-serif";
const D = "6 4";
const SW = "1.5";

function Arrow({ id, fill }: { id: string; fill: string }) {
  return (
    <marker id={id} refX="8" refY="3.5" markerWidth="8" markerHeight="7" orient="auto" markerUnits="userSpaceOnUse">
      <polygon points="0 0, 8 3.5, 0 7" fill={fill} />
    </marker>
  );
}

function Line({ x1, y1, x2, y2, color, mark = "url(#a)", dash }: {
  x1: number; y1: number; x2: number; y2: number; color?: string; mark?: string; dash?: boolean;
}) {
  const C = useDiagramColors();
  return (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={color ?? C.line} strokeWidth={SW} strokeDasharray={dash ? D : undefined}
      markerEnd={mark}
    />
  );
}

function Path({ d, color, mark, dash }: { d: string; color?: string; mark?: string; dash?: boolean }) {
  const C = useDiagramColors();
  return (
    <path
      d={d} fill="none"
      stroke={color ?? C.line} strokeWidth={SW} strokeDasharray={dash ? D : undefined}
      strokeLinejoin="round" markerEnd={mark}
    />
  );
}

function BoxText({ x, cy, label, sub, color, subColor, size = 11, subSize = 8.5 }: {
  x: number; cy: number; label: string; sub?: string;
  color: string; subColor?: string; size?: number; subSize?: number;
}) {
  if (!sub) {
    return (
      <text x={x} y={cy + 4} textAnchor="middle" fill={color} fontSize={size} fontWeight="600" fontFamily={F}>
        {label}
      </text>
    );
  }
  return (
    <>
      <text x={x} y={cy - 5} textAnchor="middle" fill={color} fontSize={size} fontWeight="600" fontFamily={F}>{label}</text>
      <text x={x} y={cy + 8} textAnchor="middle" fill={subColor ?? color} fontSize={subSize} fontFamily={F}>{sub}</text>
    </>
  );
}

function ProcNode({ x, y, w = 200, h = 52, rx = 7, fill, stroke, label, sub, lc, sc }: {
  x: number; y: number; w?: number; h?: number; rx?: number;
  fill?: string; stroke?: string; label: string; sub?: string; lc?: string; sc?: string;
}) {
  const C = useDiagramColors();
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={fill ?? C.procFill} stroke={stroke ?? C.procStroke} strokeWidth={SW} />
      <BoxText x={cx} cy={cy} label={label} sub={sub} color={lc ?? C.procText} subColor={sc ?? C.procSub} />
    </>
  );
}

function PillNode({ x, y, w = 150, h = 36, label, sub }: {
  x: number; y: number; w?: number; h?: number; label: string; sub?: string;
}) {
  const C = useDiagramColors();
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={C.pillFill} stroke={C.pillStroke} strokeWidth={SW} />
      <BoxText x={cx} cy={cy} label={label} sub={sub} color={C.pillText} subColor={C.pillSub} size={12} subSize={8.5} />
    </>
  );
}

function Diamond({ cx, cy, hw, hh, label, label2 }: {
  cx: number; cy: number; hw: number; hh: number; label: string; label2?: string;
}) {
  const C = useDiagramColors();
  const pts = `${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`;
  return (
    <>
      <polygon points={pts} fill={C.diaFill} stroke={C.diaStroke} strokeWidth={SW} />
      {label2 ? (
        <>
          <text x={cx} y={cy - 3} textAnchor="middle" fill={C.diaText} fontSize="10" fontWeight="700" fontFamily={F}>{label}</text>
          <text x={cx} y={cy + 11} textAnchor="middle" fill={C.diaText} fontSize="10" fontWeight="700" fontFamily={F}>{label2}</text>
        </>
      ) : (
        <text x={cx} y={cy + 4} textAnchor="middle" fill={C.diaText} fontSize="10" fontWeight="700" fontFamily={F}>{label}</text>
      )}
    </>
  );
}

function EdgeLabel({ x, y, text, anchor = "start" }: {
  x: number; y: number; text: string; anchor?: "start" | "middle" | "end";
}) {
  const C = useDiagramColors();
  return <text x={x} y={y} textAnchor={anchor} fill={C.lineLabel} fontSize="8" fontFamily={F}>{text}</text>;
}

function UserJourneyDiagram() {
  const C = useDiagramColors();
  const cx = 340;

  return (
    <svg viewBox="0 0 680 1020" className="w-full h-auto max-h-[28rem] mx-auto block" preserveAspectRatio="xMidYMid meet" aria-label="User journey flowchart">
      <defs>
        <Arrow id="a" fill={C.line} />
        <Arrow id="ab" fill={C.noteLine} />
        <Arrow id="am" fill={C.memoryLine} />
      </defs>

      <Line x1={cx} y1={56} x2={cx} y2={78} />
      <Line x1={cx} y1={130} x2={cx} y2={152} />
      <Line x1={cx} y1={204} x2={cx} y2={226} />
      <Line x1={cx} y1={278} x2={cx} y2={300} />
      <Line x1={cx} y1={352} x2={cx} y2={378} />
      <Path d={`M ${cx - 95},430 L 120,430 L 120,498`} mark="url(#a)" />
      <Path d={`M ${cx + 95},430 L 560,430 L 560,498`} mark="url(#a)" />
      <Line x1={120} y1={550} x2={120} y2={578} />
      <Line x1={560} y1={550} x2={560} y2={578} />
      <Path d="M 120,630 L 120,660 L 340,660 L 340,678" mark="url(#a)" />
      <Path d="M 560,630 L 560,660 L 340,660" />
      <Line x1={cx} y1={730} x2={cx} y2={752} />
      <Line x1={cx} y1={804} x2={cx} y2={826} />
      <Line x1={cx} y1={878} x2={cx} y2={900} />
      <Path d="M 530,940 L 580,940 L 580,325 L 530,325" color={C.memoryLine} mark="url(#am)" dash />
      <circle cx={cx} cy={660} r={3} fill={C.line} />

      <EdgeLabel x={200} y={424} text="Later" anchor="middle" />
      <EdgeLabel x={480} y={424} text="Now" anchor="middle" />
      <EdgeLabel x={545} y={932} text="next interview" anchor="end" />

      <PillNode x={cx - 75} y={20} label="Start" sub="Open app" />
      <ProcNode x={cx - 100} y={78} w={200} label="Register · Login" sub="Sanctum token · /login · /register" />
      <ProcNode x={cx - 100} y={152} w={200} label="Dashboard" sub="History · scores · scheduled alarms" />
      <ProcNode
        x={455} y={152} w={175} h={52}
        fill={C.noteFill} stroke={C.noteStroke}
        label="Profile"
        sub="Name · theme · password"
        lc={C.noteText} sc={C.noteSub}
      />
      <Line x1={440} y1={178} x2={453} y2={178} color={C.noteLine} mark="url(#ab)" />
      <ProcNode x={cx - 100} y={226} w={200} label="Upload CV" sub="PDF/DOCX → parse skills (queue)" />
      <ProcNode x={cx - 100} y={300} w={200} label="Interview Setup" sub="JD · level · type · memory-aware Qs" />
      <Diamond cx={cx} cy={408} hw={88} hh={48} label="When to" label2="start?" />
      <ProcNode x={44} y={498} w={152} label="Schedule" sub="Date/time · alarm message" />
      <ProcNode x={484} y={498} w={152} label="Start Now" sub="Instant session UUID" />
      <ProcNode x={44} y={578} w={152} label="Browser Alarm" sub="In-app banner + email queue" />
      <ProcNode x={cx - 110} y={678} w={220} h={52} label="Live Interview" sub="WS questions · cam/mic · record A/V" />
      <ProcNode
        x={455} y={668} w={175} h={52}
        fill={C.noteFill} stroke={C.noteStroke}
        label="Full-session video" sub="MediaRecorder → upload on end"
        lc={C.noteText} sc={C.noteSub}
      />
      <Line x1={450} y1={694} x2={453} y2={694} color={C.noteLine} mark="url(#ab)" />
      <ProcNode
        x={cx - 110} y={752} w={220} h={52}
        fill={C.aiFill} stroke={C.aiStroke}
        label="AI Evaluation" sub="Ollama score · vision behavior · mastery"
        lc={C.aiText} sc={C.aiSub}
      />
      <ProcNode x={cx - 100} y={826} w={200} label="Results · Explain" sub="Per-question STAR · behavior charts" />
      <PillNode x={cx - 85} y={900} w={170} h={38} label="PDF Report" sub="Download · dashboard analytics" />
      <ProcNode
        x={455} y={900} w={195} h={52}
        fill={C.memoryFill} stroke={C.memoryStroke}
        label="Cross-interview memory" sub="Skip mastered Qs (≥60) next time"
        lc={C.memoryText} sc={C.memorySub}
      />
    </svg>
  );
}

function RuntimeDiagram() {
  const C = useDiagramColors();
  const cx = 340;

  return (
    <svg viewBox="0 0 680 620" className="w-full h-auto max-h-[22rem] mx-auto block" preserveAspectRatio="xMidYMid meet" aria-label="Runtime architecture flowchart">
      <defs>
        <Arrow id="ra" fill={C.line} />
        <Arrow id="rws" fill={C.wsLine} />
        <Arrow id="rm" fill={C.memoryLine} />
        <Arrow id="ab" fill={C.noteLine} />
      </defs>

      <Line x1={cx} y1={88} x2={cx} y2={118} mark="url(#ra)" />
      <EdgeLabel x={cx + 6} y={106} text="REST · Sanctum" />
      <Path d="M 200,62 L 90,62 L 90,148" color={C.wsLine} mark="url(#rws)" />
      <EdgeLabel x={94} y={108} text="WS subscribe" />
      <Line x1={430} y1={148} x2={500} y2={148} mark="url(#ra)" />
      <EdgeLabel x={438} y={142} text="CRUD" />
      <Line x1={250} y1={148} x2={175} y2={148} mark="url(#ra)" />
      <EdgeLabel x={182} y={142} text="broadcast" anchor="end" />
      <Line x1={cx} y1={174} x2={cx} y2={208} mark="url(#ra)" />
      <EdgeLabel x={cx + 6} y={194} text="dispatch" />
      <Line x1={cx} y1={262} x2={cx} y2={298} mark="url(#ra)" />
      <EdgeLabel x={cx + 6} y={282} text="HTTP jobs" />
      <Path d="M 250,350 L 130,410" mark="url(#ra)" />
      <Path d="M 340,350 L 340,410" mark="url(#ra)" />
      <Path d="M 430,350 L 550,410" mark="url(#ra)" />
      <EdgeLabel x={138} y={388} text="LLM" anchor="end" />
      <EdgeLabel x={346} y={388} text="STT" anchor="middle" />
      <EdgeLabel x={542} y={388} text="vision" />
      <Path d="M 500,174 L 580,174 L 580,240 L 480,240" color={C.memoryLine} mark="url(#rm)" dash />
      <EdgeLabel x={555} y={168} text="mastery" anchor="end" />
      <Path d="M 480,62 L 580,62 L 580,148" color={C.noteLine} mark="url(#ab)" dash />
      <EdgeLabel x={555} y={56} text="video upload" anchor="end" />

      <ProcNode
        x={cx - 110} y={28} w={220} h={60}
        fill={C.browserFill} stroke={C.browserStroke}
        label="Browser · Next.js 16"
        sub="MediaRecorder · consent · live room"
        lc={C.noteText} sc={C.noteSub}
      />
      <ProcNode x={cx - 105} y={118} w={210} h={56} label="Laravel 13 API" sub="Auth · interviews · reports · upload" />
      <ProcNode x={500} y={118} w={130} h={56} fill={C.dbFill} stroke={C.dbStroke} label="MySQL" sub="scores · mastery · behaviors" lc={C.dbText} sc={C.dbSub} />
      <ProcNode x={44} y={118} w={130} h={56} fill={C.wsFill} stroke={C.wsStroke} label="Reverb WS" sub="Pusher protocol" lc={C.wsText} sc={C.wsSub} />
      <ProcNode x={cx - 115} y={208} w={230} h={54} label="Queue Worker" sub="Evaluate · GenerateQ · BehaviorJob · email" />
      <ProcNode
        x={cx - 105} y={298} w={210} h={52}
        fill={C.aiFill} stroke={C.aiStroke}
        label="FastAPI · Python" sub="Orchestration · PDF reports"
        lc={C.aiText} sc={C.aiSub}
      />
      <ProcNode x={44} y={410} w={155} h={52} fill={C.aiFill} stroke={C.aiStroke} label="Ollama Llama 3" sub="Questions · scoring" lc={C.aiText} sc={C.aiSub} />
      <ProcNode x={262} y={410} w={155} h={52} fill={C.aiFill} stroke={C.aiStroke} label="Whisper small" sub="Speech → text" lc={C.aiText} sc={C.aiSub} />
      <ProcNode x={480} y={410} w={165} h={52} fill={C.aiFill} stroke={C.aiStroke} label="Vision Pipeline" sub="GPU · emotion · gaze · prosody" lc={C.aiText} sc={C.aiSub} />
      <ProcNode
        x={44} y={500} w={200} h={52}
        fill={C.memoryFill} stroke={C.memoryStroke}
        label="Mastery Service" sub="user_question_mastery · memory profiles"
        lc={C.memoryText} sc={C.memorySub}
      />
      <ProcNode
        x={400} y={500} w={200} h={52}
        fill={C.noteFill} stroke={C.noteStroke}
        label="File Storage" sub="Per-answer clips · full_session video"
        lc={C.noteText} sc={C.noteSub}
      />
      <Line x1={500} y1={462} x2={500} y2={498} color={C.noteLine} dash />
    </svg>
  );
}

function StepLegend({ steps }: { steps: readonly { n: number; title: string; desc: string }[] }) {
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {steps.map((s) => (
        <div key={s.n} className="rounded-lg border border-border bg-muted/30 px-3 py-2">
          <p className="text-xs font-semibold text-primary">{s.n}. {s.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{s.desc}</p>
        </div>
      ))}
    </div>
  );
}

export function SystemMethodologyDiagram() {
  const { resolvedTheme } = useTheme();
  const colors = resolvedTheme === "dark" ? DARK_COLORS : LIGHT_COLORS;

  return (
    <DiagramColorsContext.Provider value={colors}>
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <section>
          <div className="flex items-center gap-3 mb-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              End-to-end user journey
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="rounded-xl border border-border bg-card py-3 px-2 shadow-sm">
            <UserJourneyDiagram />
          </div>
          <StepLegend steps={JOURNEY_STEPS} />
        </section>

        <section>
          <div className="flex items-center gap-3 mb-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Runtime architecture
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="rounded-xl border border-border bg-card py-3 px-2 shadow-sm">
            <RuntimeDiagram />
          </div>
          <StepLegend steps={RUNTIME_STEPS} />
        </section>
      </div>
    </DiagramColorsContext.Provider>
  );
}
