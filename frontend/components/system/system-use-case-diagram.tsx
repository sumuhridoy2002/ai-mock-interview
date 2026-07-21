"use client";

import { useTheme } from "@teispace/next-themes";

/** Classic UML use case diagram: actors, system boundary, use case ovals. */

interface Palette {
  boundaryFill: string;
  boundaryStroke: string;
  boundaryTitle: string;
  ovalFill: string;
  ovalStroke: string;
  ovalText: string;
  sharedFill: string;
  sharedStroke: string;
  sharedText: string;
  adminFill: string;
  adminStroke: string;
  adminText: string;
  actor: string;
  actorLabel: string;
  line: string;
}

const LIGHT: Palette = {
  boundaryFill: "#f8fafc",
  boundaryStroke: "#94a3b8",
  boundaryTitle: "#334155",
  ovalFill: "#eef2ff",
  ovalStroke: "#6366f1",
  ovalText: "#1e1b4b",
  sharedFill: "#ecfdf5",
  sharedStroke: "#10b981",
  sharedText: "#065f46",
  adminFill: "#fdf4ff",
  adminStroke: "#a855f7",
  adminText: "#581c87",
  actor: "#334155",
  actorLabel: "#0f172a",
  line: "#94a3b8",
} as const;

const DARK: Palette = {
  boundaryFill: "#0f172a",
  boundaryStroke: "#475569",
  boundaryTitle: "#cbd5e1",
  ovalFill: "#1e1b4b",
  ovalStroke: "#6366f1",
  ovalText: "#e0e7ff",
  sharedFill: "#052e16",
  sharedStroke: "#10b981",
  sharedText: "#a7f3d0",
  adminFill: "#2e1065",
  adminStroke: "#a855f7",
  adminText: "#e9d5ff",
  actor: "#cbd5e1",
  actorLabel: "#f1f5f9",
  line: "#64748b",
};

const F = "ui-sans-serif,system-ui,sans-serif";

function Actor({ x, y, label, C }: { x: number; y: number; label: string; C: Palette }) {
  return (
    <g stroke={C.actor} strokeWidth="2" fill="none">
      <circle cx={x} cy={y - 34} r={11} />
      <line x1={x} y1={y - 23} x2={x} y2={y + 8} />
      <line x1={x - 15} y1={y - 12} x2={x + 15} y2={y - 12} />
      <line x1={x} y1={y + 8} x2={x - 13} y2={y + 28} />
      <line x1={x} y1={y + 8} x2={x + 13} y2={y + 28} />
      <text
        x={x}
        y={y + 48}
        textAnchor="middle"
        fill={C.actorLabel}
        stroke="none"
        fontSize="13"
        fontWeight="700"
        fontFamily={F}
      >
        {label}
      </text>
    </g>
  );
}

function UseCase({
  cx,
  cy,
  label,
  fill,
  stroke,
  text,
  rx = 110,
  ry = 25,
}: {
  cx: number;
  cy: number;
  label: string;
  fill: string;
  stroke: string;
  text: string;
  rx?: number;
  ry?: number;
}) {
  return (
    <>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} stroke={stroke} strokeWidth="1.5" />
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fill={text}
        fontSize="11.5"
        fontWeight="600"
        fontFamily={F}
      >
        {label}
      </text>
    </>
  );
}

function Link({ x1, y1, x2, y2, C }: { x1: number; y1: number; x2: number; y2: number; C: Palette }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.line} strokeWidth="1.3" />;
}

const CANDIDATE_CASES = [
  "Upload & parse resume",
  "Set up interview",
  "Schedule with alarm",
  "Take live AI interview",
  "View results & PDF report",
  "Publish public profile",
] as const;

const ADMIN_CASES = [
  "Manage candidates",
  "Create share links",
  "View system metrics",
  "Performance analytics",
  "Browse DB class diagram",
] as const;

const CAND_X = 330;
const ADMIN_X = 575;
const ROW_START = 160;
const ROW_GAP = 62;
const ACTOR_CAND = { x: 85, y: 320 };
const ACTOR_ADMIN = { x: 815, y: 320 };

export function SystemUseCaseDiagram() {
  const { resolvedTheme } = useTheme();
  const C = resolvedTheme === "dark" ? DARK : LIGHT;

  return (
    <div className="rounded-xl border border-border bg-card p-2 sm:p-4 shadow-sm">
      <svg
        viewBox="0 0 900 620"
        className="w-full h-auto block"
        preserveAspectRatio="xMidYMid meet"
        aria-label="Use case diagram with Candidate and System Admin actors"
      >
        {/* System boundary */}
        <rect
          x={195}
          y={50}
          width={510}
          height={545}
          rx={14}
          fill={C.boundaryFill}
          stroke={C.boundaryStroke}
          strokeWidth="1.5"
          strokeDasharray="8 5"
        />
        <text
          x={450}
          y={78}
          textAnchor="middle"
          fill={C.boundaryTitle}
          fontSize="14"
          fontWeight="700"
          fontFamily={F}
        >
          Mock Interview Pro
        </text>

        {/* Candidate links */}
        {CANDIDATE_CASES.map((_, i) => (
          <Link
            key={`lc-${i}`}
            x1={ACTOR_CAND.x + 20}
            y1={ACTOR_CAND.y - 5}
            x2={CAND_X - 110}
            y2={ROW_START + i * ROW_GAP}
            C={C}
          />
        ))}
        {/* Admin links */}
        {ADMIN_CASES.map((_, i) => (
          <Link
            key={`la-${i}`}
            x1={ACTOR_ADMIN.x - 20}
            y1={ACTOR_ADMIN.y - 5}
            x2={ADMIN_X + 110}
            y2={ROW_START + i * ROW_GAP}
            C={C}
          />
        ))}

        {/* Shared: sign in (top center) */}
        <Link x1={ACTOR_CAND.x + 20} y1={ACTOR_CAND.y - 20} x2={345} y2={108} C={C} />
        <Link x1={ACTOR_ADMIN.x - 20} y1={ACTOR_ADMIN.y - 20} x2={555} y2={108} C={C} />
        {/* Shared: AI expert (bottom center) */}
        <Link x1={ACTOR_CAND.x + 20} y1={ACTOR_CAND.y + 15} x2={348} y2={548} C={C} />
        <Link x1={ACTOR_ADMIN.x - 20} y1={ACTOR_ADMIN.y + 15} x2={552} y2={548} C={C} />

        {/* Shared use cases */}
        <UseCase cx={450} cy={108} label="Register / Sign in" fill={C.sharedFill} stroke={C.sharedStroke} text={C.sharedText} rx={105} />
        <UseCase cx={450} cy={548} label="Ask AI Expert" fill={C.sharedFill} stroke={C.sharedStroke} text={C.sharedText} rx={105} />

        {/* Candidate use cases */}
        {CANDIDATE_CASES.map((label, i) => (
          <UseCase
            key={label}
            cx={CAND_X}
            cy={ROW_START + i * ROW_GAP}
            label={label}
            fill={C.ovalFill}
            stroke={C.ovalStroke}
            text={C.ovalText}
          />
        ))}

        {/* Admin use cases */}
        {ADMIN_CASES.map((label, i) => (
          <UseCase
            key={label}
            cx={ADMIN_X}
            cy={ROW_START + i * ROW_GAP}
            label={label}
            fill={C.adminFill}
            stroke={C.adminStroke}
            text={C.adminText}
          />
        ))}

        {/* Actors */}
        <Actor x={ACTOR_CAND.x} y={ACTOR_CAND.y} label="Candidate" C={C} />
        <Actor x={ACTOR_ADMIN.x} y={ACTOR_ADMIN.y} label="System Admin" C={C} />
      </svg>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-6 rounded-full border" style={{ background: C.ovalFill, borderColor: C.ovalStroke }} />
          Candidate
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-6 rounded-full border" style={{ background: C.adminFill, borderColor: C.adminStroke }} />
          System Admin
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-6 rounded-full border" style={{ background: C.sharedFill, borderColor: C.sharedStroke }} />
          Shared
        </span>
      </div>
    </div>
  );
}
