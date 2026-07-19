"use client";

import { useMemo, useState } from "react";
import {
  buildDiagramEdges,
  ERD_DIAGRAM_CANVAS,
  ERD_DIAGRAM_LAYOUT,
  ERD_ENTITY_WIDTH,
  ERD_ROW_HEIGHT,
  erdEntityHeight,
  getDiagramTables,
  type ErdDiagramSection,
  type ErdTable,
} from "@/lib/database-erd";
import { cn } from "@/lib/utils";

type AnchorSide = "left" | "right" | "top" | "bottom";

interface Point {
  x: number;
  y: number;
}

function getAnchor(table: ErdTable, side: AnchorSide): Point {
  const layout = ERD_DIAGRAM_LAYOUT[table.name];
  if (!layout) return { x: 0, y: 0 };

  const w = ERD_ENTITY_WIDTH;
  const h = erdEntityHeight(table);
  const { x, y } = layout;

  switch (side) {
    case "left":
      return { x, y: y + h / 2 };
    case "right":
      return { x: x + w, y: y + h / 2 };
    case "top":
      return { x: x + w / 2, y };
    case "bottom":
      return { x: x + w / 2, y: y + h };
  }
}

function pickSides(from: ErdTable, to: ErdTable): { from: AnchorSide; to: AnchorSide } {
  const a = ERD_DIAGRAM_LAYOUT[from.name];
  const b = ERD_DIAGRAM_LAYOUT[to.name];
  if (!a || !b) return { from: "right", to: "left" };

  const dx = b.x - a.x;
  const dy = b.y - a.y;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? { from: "right", to: "left" } : { from: "left", to: "right" };
  }
  return dy >= 0 ? { from: "bottom", to: "top" } : { from: "top", to: "bottom" };
}

function orthogonalPath(from: Point, to: Point, fromSide: AnchorSide, toSide: AnchorSide): string {
  const gap = 20;
  let x1 = from.x;
  let y1 = from.y;
  let x2 = to.x;
  let y2 = to.y;

  if (fromSide === "right") x1 += gap;
  if (fromSide === "left") x1 -= gap;
  if (fromSide === "bottom") y1 += gap;
  if (fromSide === "top") y1 -= gap;
  if (toSide === "left") x2 -= gap;
  if (toSide === "right") x2 += gap;
  if (toSide === "top") y2 -= gap;
  if (toSide === "bottom") y2 += gap;

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  if (fromSide === "right" || fromSide === "left") {
    return `M ${from.x} ${from.y} L ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2} L ${to.x} ${to.y}`;
  }
  return `M ${from.x} ${from.y} L ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2} L ${to.x} ${to.y}`;
}

function CrowFoot({ x, y, side, kind }: { x: number; y: number; side: AnchorSide; kind: "one" | "many" }) {
  const len = 12;
  const spread = 7;

  if (kind === "one") {
    if (side === "left" || side === "right") {
      return (
        <line
          x1={x}
          y1={y - 10}
          x2={x}
          y2={y + 10}
          stroke="currentColor"
          strokeWidth={2}
          className="text-indigo-500"
        />
      );
    }
    return (
      <line
        x1={x - 10}
        y1={y}
        x2={x + 10}
        y2={y}
        stroke="currentColor"
        strokeWidth={2}
        className="text-indigo-500"
      />
    );
  }

  if (side === "right") {
    return (
      <g className="text-indigo-500" stroke="currentColor" strokeWidth={1.5}>
        <line x1={x} y1={y} x2={x + len} y2={y - spread} />
        <line x1={x} y1={y} x2={x + len} y2={y} />
        <line x1={x} y1={y} x2={x + len} y2={y + spread} />
      </g>
    );
  }
  if (side === "left") {
    return (
      <g className="text-indigo-500" stroke="currentColor" strokeWidth={1.5}>
        <line x1={x} y1={y} x2={x - len} y2={y - spread} />
        <line x1={x} y1={y} x2={x - len} y2={y} />
        <line x1={x} y1={y} x2={x - len} y2={y + spread} />
      </g>
    );
  }
  if (side === "bottom") {
    return (
      <g className="text-indigo-500" stroke="currentColor" strokeWidth={1.5}>
        <line x1={x} y1={y} x2={x - spread} y2={y + len} />
        <line x1={x} y1={y} x2={x} y2={y + len} />
        <line x1={x} y1={y} x2={x + spread} y2={y + len} />
      </g>
    );
  }
  return (
    <g className="text-indigo-500" stroke="currentColor" strokeWidth={1.5}>
      <line x1={x} y1={y} x2={x - spread} y2={y - len} />
      <line x1={x} y1={y} x2={x} y2={y - len} />
      <line x1={x} y1={y} x2={x + spread} y2={y - len} />
    </g>
  );
}

function ErdEntityBox({
  table,
  highlighted,
  onHover,
}: {
  table: ErdTable;
  highlighted: boolean;
  onHover: (name: string | null) => void;
}) {
  const layout = ERD_DIAGRAM_LAYOUT[table.name];
  if (!layout) return null;

  const height = erdEntityHeight(table);

  return (
    <div
      id={`erd-${table.name}`}
      className={cn(
        "absolute z-10 overflow-hidden rounded-lg border-2 bg-card shadow-md transition-shadow",
        highlighted
          ? "border-indigo-500 shadow-indigo-500/25 ring-2 ring-indigo-500/30"
          : "border-indigo-400/80 dark:border-indigo-500/60",
      )}
      style={{ left: layout.x, top: layout.y, width: ERD_ENTITY_WIDTH, minHeight: height }}
      onMouseEnter={() => onHover(table.name)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="flex items-center gap-2 bg-indigo-600 px-3 py-2.5 text-sm font-bold text-white dark:bg-indigo-700">
        <span className="truncate">{table.name}</span>
      </div>
      <ul className="divide-y divide-border/80">
        {table.columns.map((column) => (
          <li
            key={column.name}
            className="flex items-center gap-2 px-2.5 text-[11px] font-mono leading-6"
            style={{ minHeight: ERD_ROW_HEIGHT }}
          >
            {column.kind === "pk" && (
              <span className="shrink-0 rounded bg-amber-500/20 px-1 text-[9px] font-bold text-amber-700 dark:text-amber-300">
                PK
              </span>
            )}
            {column.kind === "fk" && (
              <span className="shrink-0 rounded bg-sky-500/20 px-1 text-[9px] font-bold text-sky-700 dark:text-sky-300">
                FK
              </span>
            )}
            {column.kind === "uk" && (
              <span className="shrink-0 rounded bg-violet-500/20 px-1 text-[9px] font-bold text-violet-700 dark:text-violet-300">
                UK
              </span>
            )}
            {!column.kind || column.kind === "col" ? (
              <span className="w-6 shrink-0" aria-hidden />
            ) : null}
            <span className="truncate text-foreground">{column.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ErdDiagramCanvas({
  section,
  title,
  subtitle,
}: {
  section: ErdDiagramSection;
  title: string;
  subtitle: string;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const tables = useMemo(() => getDiagramTables(section), [section]);
  const edges = useMemo(() => buildDiagramEdges(section), [section]);
  const canvas = ERD_DIAGRAM_CANVAS[section];

  const tableMap = useMemo(() => new Map(tables.map((t) => [t.name, t])), [tables]);

  const connected = useMemo(() => {
    if (!hovered) return null;
    const set = new Set<string>([hovered]);
    edges.forEach((edge) => {
      if (edge.from === hovered || edge.to === hovered) {
        set.add(edge.from);
        set.add(edge.to);
      }
    });
    return set;
  }, [hovered, edges]);

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="overflow-auto rounded-xl border border-border bg-[#f8fafc] dark:bg-slate-950/50">
        <div
          className="relative"
          style={{ width: canvas.width, height: canvas.height, minWidth: canvas.width, minHeight: canvas.height }}
        >
          {/* Grid dots */}
          <svg
            className="pointer-events-none absolute inset-0 text-slate-300/60 dark:text-slate-700/40"
            width={canvas.width}
            height={canvas.height}
          >
            <defs>
              <pattern id={`grid-${section}`} width={24} height={24} patternUnits="userSpaceOnUse">
                <circle cx={1} cy={1} r={1} fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#grid-${section})`} />
          </svg>

          {/* Relationship lines */}
          <svg
            className="pointer-events-none absolute inset-0 overflow-visible"
            width={canvas.width}
            height={canvas.height}
          >
            {edges.map((edge) => {
              const fromTable = tableMap.get(edge.from);
              const toTable = tableMap.get(edge.to);
              if (!fromTable || !toTable) return null;

              const isSelf = edge.from === edge.to;
              const active =
                !connected || (connected.has(edge.from) && connected.has(edge.to));

              if (isSelf) {
                const layout = ERD_DIAGRAM_LAYOUT[edge.from];
                const h = erdEntityHeight(fromTable);
                const cx = layout.x + ERD_ENTITY_WIDTH + 28;
                const cy = layout.y + h / 2;
                return (
                  <path
                    key={`${edge.from}-self`}
                    d={`M ${layout.x + ERD_ENTITY_WIDTH} ${layout.y + h / 2} C ${cx + 40} ${cy - 60}, ${cx + 40} ${cy + 60}, ${layout.x + ERD_ENTITY_WIDTH} ${layout.y + h / 2}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={active ? 2 : 1}
                    className={cn(active ? "text-indigo-500" : "text-indigo-300/50 dark:text-indigo-800")}
                  />
                );
              }

              const sides = pickSides(fromTable, toTable);
              const fromPt = getAnchor(fromTable, sides.from);
              const toPt = getAnchor(toTable, sides.to);
              const path = orthogonalPath(fromPt, toPt, sides.from, sides.to);

              return (
                <g key={`${edge.from}-${edge.to}-${edge.fromCard}`}>
                  <path
                    d={path}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={active ? 2 : 1}
                    className={cn(active ? "text-indigo-500" : "text-indigo-300/50 dark:text-indigo-800")}
                  />
                  <CrowFoot x={fromPt.x} y={fromPt.y} side={sides.from} kind={edge.fromCard} />
                  <CrowFoot x={toPt.x} y={toPt.y} side={sides.to} kind={edge.toCard} />
                </g>
              );
            })}
          </svg>

          {tables.map((table) => (
            <ErdEntityBox
              key={table.name}
              table={table}
              highlighted={!connected || connected.has(table.name)}
              onHover={setHovered}
            />
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Crow&apos;s foot notation: | = one · &lt; = many. Hover a table to highlight its relationships.
      </p>
    </div>
  );
}

export function DatabaseErdDiagram() {
  return (
    <div className="space-y-10">
      <ErdDiagramCanvas
        section="core"
        title="Application schema"
        subtitle="Users, interviews, scoring, AI memory, and public sharing — primary business entities."
      />
      <ErdDiagramCanvas
        section="framework"
        title="Laravel infrastructure"
        subtitle="Queue, cache, and failed-job tables used by the framework runtime."
      />
    </div>
  );
}
