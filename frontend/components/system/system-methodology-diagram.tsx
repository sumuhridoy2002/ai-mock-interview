"use client";

/* ─── colours ─────────────────────────────────────────────────────────────── */
const C = {
  /* process rectangle */
  procFill: "#1e1b4b",
  procStroke: "#4f46e5",
  procText: "#e0e7ff",
  procSub: "#a5b4fc",

  /* decision diamond */
  diaFill: "#2e1065",
  diaStroke: "#7c3aed",
  diaText: "#ddd6fe",

  /* start / end pill */
  pillFill: "#052e16",
  pillStroke: "#10b981",
  pillText: "#34d399",
  pillSub: "#6ee7b7",

  /* side-note box (queued e-mail) */
  noteFill: "#0c1a2e",
  noteStroke: "#1d4ed8",
  noteText: "#93c5fd",
  noteSub: "#60a5fa",

  /* browser box */
  browserFill: "#0c1a2e",
  browserStroke: "#1d4ed8",

  /* AI nodes */
  aiFill: "#1a0a2e",
  aiStroke: "#9333ea",
  aiText: "#e9d5ff",
  aiSub: "#c084fc",

  /* database / utility */
  dbFill: "#111827",
  dbStroke: "#374151",
  dbText: "#d1d5db",
  dbSub: "#6b7280",

  /* Reverb WS */
  wsFill: "#1e0f3a",
  wsStroke: "#7c3aed",
  wsText: "#ddd6fe",
  wsSub: "#a78bfa",

  /* connector lines */
  line: "#4f46e5",
  lineLabel: "#64748b",
  noteLine: "#3b82f6",
  wsLine: "#8b5cf6",
};

/* ─── shared SVG primitives ───────────────────────────────────────────────── */
const F = "ui-sans-serif,system-ui,sans-serif";
const D = "6 4"; /* dash pattern */
const SW = "1.5"; /* stroke width */

function Arrow({ id, fill }: { id: string; fill: string }) {
  return (
    <marker
      id={id}
      refX="8"
      refY="3.5"
      markerWidth="8"
      markerHeight="7"
      orient="auto"
      markerUnits="userSpaceOnUse"
    >
      <polygon points="0 0, 8 3.5, 0 7" fill={fill} />
    </marker>
  );
}

type LineProps = {
  x1: number; y1: number; x2: number; y2: number;
  color?: string; mark?: string;
};
function Line({ x1, y1, x2, y2, color = C.line, mark = "url(#a)" }: LineProps) {
  return (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={color} strokeWidth={SW} strokeDasharray={D}
      markerEnd={mark}
    />
  );
}

type PathProps = { d: string; color?: string; mark?: string };
function Path({ d, color = C.line, mark }: PathProps) {
  return (
    <path
      d={d} fill="none"
      stroke={color} strokeWidth={SW} strokeDasharray={D}
      strokeLinejoin="round"
      markerEnd={mark}
    />
  );
}

/* boxLabel: single label centred; dual: label + smaller sub */
function BoxText({
  x, cy, label, sub, color, subColor, size = 12, subSize = 9.5,
}: {
  x: number; cy: number; label: string; sub?: string;
  color: string; subColor?: string; size?: number; subSize?: number;
}) {
  if (!sub) {
    return (
      <text x={x} y={cy + 5} textAnchor="middle" fill={color}
        fontSize={size} fontWeight="600" fontFamily={F}>
        {label}
      </text>
    );
  }
  return (
    <>
      <text x={x} y={cy - 4} textAnchor="middle" fill={color}
        fontSize={size} fontWeight="600" fontFamily={F}>
        {label}
      </text>
      <text x={x} y={cy + 10} textAnchor="middle" fill={subColor ?? color}
        fontSize={subSize} fontFamily={F}>
        {sub}
      </text>
    </>
  );
}

/* process rectangle node */
function ProcNode({
  x, y, w = 160, h = 46, rx = 7,
  fill = C.procFill, stroke = C.procStroke,
  label, sub, lc = C.procText, sc = C.procSub,
}: {
  x: number; y: number; w?: number; h?: number; rx?: number;
  fill?: string; stroke?: string;
  label: string; sub?: string; lc?: string; sc?: string;
}) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx={rx}
        fill={fill} stroke={stroke} strokeWidth={SW} />
      <BoxText x={cx} cy={cy} label={label} sub={sub} color={lc} subColor={sc} />
    </>
  );
}

/* pill (start / end) */
function PillNode({
  x, y, w = 140, h = 38,
  label, sub,
}: { x: number; y: number; w?: number; h?: number; label: string; sub?: string }) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx={h / 2}
        fill={C.pillFill} stroke={C.pillStroke} strokeWidth={SW} />
      <BoxText x={cx} cy={cy} label={label} sub={sub}
        color={C.pillText} subColor={C.pillSub} size={13} subSize={9.5} />
    </>
  );
}

/* diamond decision node — centred at (cx, cy), half-extents hw × hh */
function Diamond({
  cx, cy, hw, hh,
  label, label2,
}: { cx: number; cy: number; hw: number; hh: number; label: string; label2?: string }) {
  const pts = `${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`;
  return (
    <>
      <polygon points={pts}
        fill={C.diaFill} stroke={C.diaStroke} strokeWidth={SW} />
      {label2 ? (
        <>
          <text x={cx} y={cy - 3} textAnchor="middle" fill={C.diaText}
            fontSize="11" fontWeight="700" fontFamily={F}>{label}</text>
          <text x={cx} y={cy + 11} textAnchor="middle" fill={C.diaText}
            fontSize="11" fontWeight="700" fontFamily={F}>{label2}</text>
        </>
      ) : (
        <text x={cx} y={cy + 4} textAnchor="middle" fill={C.diaText}
          fontSize="11" fontWeight="700" fontFamily={F}>{label}</text>
      )}
    </>
  );
}

function EdgeLabel({ x, y, text, anchor = "start" }: {
  x: number; y: number; text: string;
  anchor?: "start" | "middle" | "end" | "inherit";
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} fill={C.lineLabel}
      fontSize="9.5" fontFamily={F}>{text}</text>
  );
}

/* ─── Diagram A: User Journey ─────────────────────────────────────────────── */
function UserJourneyDiagram() {
  /*
    Layout key (all x/y in SVG user units, viewBox 0 0 560 755)
    ─────────────────────────────────────────────────────────────
    START pill          cx=280  y=30
    REGISTER            x=200   y=110   w=160 h=46
    WELCOME EMAIL note  x=400   y=110   w=145 h=46   (side)
    UPLOAD CV           x=200   y=205   w=160 h=46
    INTERVIEW SETUP     x=200   y=300   w=160 h=46
    DECISION diamond    cx=280  cy=420  hw=90 hh=52
    SCHEDULE            x=48    y=510   w=152 h=46
    START NOW           x=360   y=510   w=152 h=46
    EMAIL REMINDER      x=48    y=605   w=152 h=46
    LIVE INTERVIEW      x=360   y=605   w=152 h=46
    PDF REPORT pill     cx=280  y=695   w=160 h=40
  */
  return (
    <svg viewBox="0 0 560 755" className="w-full max-w-xl mx-auto"
      aria-label="User journey flowchart">
      <defs>
        <Arrow id="a" fill={C.line} />
        <Arrow id="ab" fill={C.noteLine} />
      </defs>

      {/* ── connections (drawn first = behind shapes) ─────────────────── */}

      {/* Start → Register */}
      <Line x1={280} y1={68} x2={280} y2={108} />

      {/* Register side → Welcome Email */}
      <Line x1={360} y1={133} x2={398} y2={133} color={C.noteLine} mark="url(#ab)" />

      {/* Register → Upload CV */}
      <Line x1={280} y1={156} x2={280} y2={203} />

      {/* Upload CV → Interview Setup */}
      <Line x1={280} y1={251} x2={280} y2={298} />

      {/* Interview Setup → Diamond */}
      <Line x1={280} y1={346} x2={280} y2={366} />

      {/* Diamond left → Schedule */}
      <Path d="M 190,420 L 124,420 L 124,508" mark="url(#a)" />

      {/* Diamond right → Start Now */}
      <Path d="M 370,420 L 436,420 L 436,508" mark="url(#a)" />

      {/* Schedule → Email Reminder */}
      <Line x1={124} y1={556} x2={124} y2={603} />

      {/* Start Now → Live Interview */}
      <Line x1={436} y1={556} x2={436} y2={603} />

      {/* Merge: Email Reminder → Report */}
      <Path d="M 124,651 L 124,682 L 280,682 L 280,693" mark="url(#a)" />

      {/* Merge: Live Interview → same horizontal */}
      <Path d="M 436,651 L 436,682 L 280,682" />

      {/* Junction dot */}
      <circle cx={280} cy={682} r={3} fill={C.line} />

      {/* ── branch labels ─────────────────────────────────────────────── */}
      <EdgeLabel x={154} y={414} text="Later" anchor="middle" />
      <EdgeLabel x={406} y={414} text="Now" anchor="middle" />

      {/* ── shapes ────────────────────────────────────────────────────── */}

      {/* START */}
      <PillNode x={210} y={30} w={140} h={38} label="Start" />

      {/* REGISTER */}
      <ProcNode x={200} y={108} label="Register" sub="Create account" />

      {/* WELCOME EMAIL side note */}
      <ProcNode
        x={398} y={108} w={148} h={46}
        fill={C.noteFill} stroke={C.noteStroke}
        label="Welcome Email" sub="queued via worker"
        lc={C.noteText} sc={C.noteSub}
      />

      {/* UPLOAD CV */}
      <ProcNode x={200} y={203} label="Upload CV" sub="PDF / DOCX → parsed" />

      {/* INTERVIEW SETUP */}
      <ProcNode x={200} y={298} label="Interview Setup" sub="Job title + description" />

      {/* DECISION */}
      <Diamond cx={280} cy={420} hw={90} hh={52} label="When to" label2="start?" />

      {/* SCHEDULE */}
      <ProcNode x={48} y={508} w={152} label="Schedule" sub="Set date & time" />

      {/* START NOW */}
      <ProcNode x={360} y={508} w={152} label="Start Now" sub="Jump straight in" />

      {/* EMAIL REMINDER */}
      <ProcNode x={48} y={603} w={152} label="Email Reminder" sub="10 min before" />

      {/* LIVE INTERVIEW */}
      <ProcNode x={360} y={603} w={152} label="Live Interview" sub="Whisper + Ollama" />

      {/* PDF REPORT */}
      <PillNode x={200} y={693} w={160} h={40} label="PDF Report" sub="Scores + feedback" />
    </svg>
  );
}

/* ─── Diagram B: Runtime Architecture ────────────────────────────────────── */
function RuntimeDiagram() {
  /*
    Layout (viewBox 0 0 560 490)
    ──────────────────────────────────────────
    BROWSER             cx=280  y=28    w=200 h=46
    LARAVEL API         cx=280  y=133   w=210 h=46
    MYSQL DB            cx=485  y=133   w=110 h=46  (right)
    REVERB WS           cx=70   y=133   w=115 h=46  (left)
    QUEUE WORKER        cx=280  y=238   w=190 h=46
    FASTAPI             cx=280  y=338   w=190 h=46
    OLLAMA              cx=110  y=428   w=160 h=46
    WHISPER             cx=450  y=428   w=160 h=46
  */
  return (
    <svg viewBox="0 0 560 490" className="w-full max-w-xl mx-auto"
      aria-label="Runtime architecture flowchart">
      <defs>
        <Arrow id="ra" fill={C.line} />
        <Arrow id="rws" fill={C.wsLine} />
      </defs>

      {/* ── connections ───────────────────────────────────────────────── */}

      {/* Browser → Laravel (REST) */}
      <Line x1={280} y1={74} x2={280} y2={131} mark="url(#ra)" />
      <EdgeLabel x={286} y={106} text="REST · Sanctum" />

      {/* Laravel right → MySQL */}
      <Line x1={385} y1={156} x2={428} y2={156} mark="url(#ra)" />
      <EdgeLabel x={392} y={150} text="reads/writes" />

      {/* Laravel left → Reverb */}
      <Line x1={175} y1={156} x2={128} y2={156} mark="url(#ra)" />
      <EdgeLabel x={135} y={150} text="broadcast" anchor="end" />

      {/* Reverb → Browser (WebSocket events) */}
      <Path
        d="M 70,133 L 70,51 L 180,51"
        color={C.wsLine} mark="url(#rws)"
      />
      <EdgeLabel x={74} y={95} text="WS events" />

      {/* Laravel → Queue */}
      <Line x1={280} y1={179} x2={280} y2={236} mark="url(#ra)" />
      <EdgeLabel x={286} y={211} text="dispatch jobs" />

      {/* Queue → FastAPI */}
      <Line x1={280} y1={284} x2={280} y2={336} mark="url(#ra)" />
      <EdgeLabel x={286} y={313} text="HTTP" />

      {/* FastAPI → Ollama (diagonal) */}
      <Path d="M 185,361 L 110,426" mark="url(#ra)" />
      <EdgeLabel x={120} y={398} text="LLM" anchor="end" />

      {/* FastAPI → Whisper (diagonal) */}
      <Path d="M 375,361 L 450,426" mark="url(#ra)" />
      <EdgeLabel x={440} y={398} text="STT" />

      {/* ── shapes ────────────────────────────────────────────────────── */}

      {/* BROWSER */}
      <ProcNode
        x={180} y={28} w={200}
        fill={C.browserFill} stroke={C.browserStroke}
        label="Browser · Next.js 16"
        sub="React · Tailwind · WS client"
        lc={C.noteText} sc={C.noteSub}
      />

      {/* LARAVEL API */}
      <ProcNode
        x={175} y={133} w={210}
        label="Laravel 13 API"
        sub="Auth · Routes · Services"
      />

      {/* MYSQL */}
      <ProcNode
        x={430} y={133} w={110}
        fill={C.dbFill} stroke={C.dbStroke}
        label="MySQL" sub="persistence"
        lc={C.dbText} sc={C.dbSub}
      />

      {/* REVERB WS */}
      <ProcNode
        x={12} y={133} w={116}
        fill={C.wsFill} stroke={C.wsStroke}
        label="Reverb WS" sub="real-time"
        lc={C.wsText} sc={C.wsSub}
      />

      {/* QUEUE WORKER */}
      <ProcNode
        x={185} y={238} w={190}
        label="Queue Worker"
        sub="Laravel Queue · email jobs"
      />

      {/* FASTAPI */}
      <ProcNode
        x={185} y={338} w={190}
        fill={C.aiFill} stroke={C.aiStroke}
        label="FastAPI · Python"
        sub="AI service orchestration"
        lc={C.aiText} sc={C.aiSub}
      />

      {/* OLLAMA */}
      <ProcNode
        x={30} y={428} w={160}
        fill={C.aiFill} stroke={C.aiStroke}
        label="Ollama (Llama 3)"
        sub="Questions + scoring"
        lc={C.aiText} sc={C.aiSub}
      />

      {/* WHISPER */}
      <ProcNode
        x={370} y={428} w={160}
        fill={C.aiFill} stroke={C.aiStroke}
        label="Whisper (small)"
        sub="Speech → text"
        lc={C.aiText} sc={C.aiSub}
      />
    </svg>
  );
}

/* ─── public export ───────────────────────────────────────────────────────── */
export function SystemMethodologyDiagram() {
  return (
    <div className="space-y-10">
      {/* Diagram A */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <span className="h-px flex-1 bg-slate-800" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            End-to-end user journey
          </span>
          <span className="h-px flex-1 bg-slate-800" />
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-800/70 bg-slate-950/60 py-4 px-2">
          <UserJourneyDiagram />
        </div>
      </div>

      {/* Diagram B */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <span className="h-px flex-1 bg-slate-800" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            Runtime architecture
          </span>
          <span className="h-px flex-1 bg-slate-800" />
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-800/70 bg-slate-950/60 py-4 px-2">
          <RuntimeDiagram />
        </div>
      </div>
    </div>
  );
}
