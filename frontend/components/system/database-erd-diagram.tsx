"use client";

import { useCallback, useRef, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ERD_POSTER_ENTITIES,
  ERD_POSTER_HEADER_HEIGHT,
  ERD_POSTER_RELATIONS,
  ERD_POSTER_ROW_HEIGHT,
  ERD_POSTER_TITLE,
  ERD_POSTER_VIEWBOX,
  getPosterEntity,
  posterEntityHeight,
  type PosterEntity,
  type PosterRelation,
} from "@/lib/database-erd-poster";

const EXPORT_SCALE = 4;

type Side = PosterRelation["fromSide"];

function anchor(entity: PosterEntity, side: Side): { x: number; y: number } {
  const h = posterEntityHeight(entity);
  const { x, y, width } = entity;
  switch (side) {
    case "left":
      return { x, y: y + h / 2 };
    case "right":
      return { x: x + width, y: y + h / 2 };
    case "top":
      return { x: x + width / 2, y };
    case "bottom":
      return { x: x + width / 2, y: y + h };
  }
}

function relationPath(from: PosterEntity, to: PosterEntity, rel: PosterRelation): string {
  const a = anchor(from, rel.fromSide);
  const b = anchor(to, rel.toSide);

  if (rel.fromSide === "right" && rel.toSide === "left") {
    const mid = (a.x + b.x) / 2;
    return `M ${a.x} ${a.y} L ${mid} ${a.y} L ${mid} ${b.y} L ${b.x} ${b.y}`;
  }
  if (rel.fromSide === "bottom" && rel.toSide === "top") {
    const mid = (a.y + b.y) / 2;
    return `M ${a.x} ${a.y} L ${a.x} ${mid} L ${b.x} ${mid} L ${b.x} ${b.y}`;
  }
  if (rel.fromSide === "right" && rel.toSide === "bottom") {
    return `M ${a.x} ${a.y} L ${b.x} ${a.y} L ${b.x} ${b.y}`;
  }
  return `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
}

function cardLabelPoint(from: PosterEntity, to: PosterEntity, rel: PosterRelation, which: "from" | "to") {
  const a = anchor(from, rel.fromSide);
  const b = anchor(to, rel.toSide);
  if (which === "from") {
    if (rel.fromSide === "right") return { x: a.x + 14, y: a.y - 8 };
    if (rel.fromSide === "bottom") return { x: a.x - 10, y: a.y + 16 };
    return { x: a.x, y: a.y - 10 };
  }
  if (rel.toSide === "left") return { x: b.x - 18, y: b.y - 8 };
  if (rel.toSide === "top") return { x: b.x + 6, y: b.y - 12 };
  return { x: b.x - 10, y: b.y + 14 };
}

function PosterEntityBox({ entity }: { entity: PosterEntity }) {
  const height = posterEntityHeight(entity);

  return (
    <g>
      <rect
        x={entity.x}
        y={entity.y}
        width={entity.width}
        height={height}
        fill="#ffffff"
        stroke="#64748b"
        strokeWidth={1.5}
        rx={2}
      />
      <rect x={entity.x} y={entity.y} width={entity.width} height={ERD_POSTER_HEADER_HEIGHT} fill={entity.headerColor} rx={2} />
      <rect x={entity.x} y={entity.y + ERD_POSTER_HEADER_HEIGHT - 2} width={entity.width} height={4} fill={entity.headerColor} />
      <text
        x={entity.x + entity.width / 2}
        y={entity.y + 25}
        textAnchor="middle"
        fill="#ffffff"
        fontSize={15}
        fontWeight={700}
        fontFamily="Arial, Helvetica, sans-serif"
      >
        {entity.title}
      </text>
      {entity.fields.map((field, index) => {
        const rowY = entity.y + ERD_POSTER_HEADER_HEIGHT + 8 + index * ERD_POSTER_ROW_HEIGHT;
        return (
          <g key={field.name}>
            <line
              x1={entity.x + 8}
              x2={entity.x + entity.width - 8}
              y1={rowY + ERD_POSTER_ROW_HEIGHT - 6}
              y2={rowY + ERD_POSTER_ROW_HEIGHT - 6}
              stroke="#e2e8f0"
              strokeWidth={1}
            />
            {field.kind === "PK" && (
              <text x={entity.x + 14} y={rowY + 12} fill="#b45309" fontSize={11} fontWeight={700} fontFamily="Arial, sans-serif">
                PK
              </text>
            )}
            {field.kind === "FK" && (
              <text x={entity.x + 14} y={rowY + 12} fill="#0369a1" fontSize={11} fontWeight={700} fontFamily="Arial, sans-serif">
                FK
              </text>
            )}
            <text
              x={entity.x + (field.kind ? 42 : 14)}
              y={rowY + 12}
              fill="#1e293b"
              fontSize={13}
              fontFamily="Consolas, Monaco, monospace"
            >
              {field.name}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function PosterRelationLine({ rel }: { rel: PosterRelation }) {
  const from = getPosterEntity(rel.from);
  const to = getPosterEntity(rel.to);
  if (!from || !to) return null;

  const path = relationPath(from, to, rel);
  const fromLabel = cardLabelPoint(from, to, rel, "from");
  const toLabel = cardLabelPoint(from, to, rel, "to");

  return (
    <g>
      <path d={path} fill="none" stroke="#475569" strokeWidth={2} />
      <text x={fromLabel.x} y={fromLabel.y} fill="#334155" fontSize={14} fontWeight={700} fontFamily="Arial, sans-serif">
        {rel.fromCard}
      </text>
      <text x={toLabel.x} y={toLabel.y} fill="#334155" fontSize={14} fontWeight={700} fontFamily="Arial, sans-serif">
        {rel.toCard}
      </text>
    </g>
  );
}

function PosterErdSvg({ svgRef }: { svgRef: React.RefObject<SVGSVGElement | null> }) {
  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${ERD_POSTER_VIEWBOX.width} ${ERD_POSTER_VIEWBOX.height}`}
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={ERD_POSTER_TITLE}
    >
      <rect width={ERD_POSTER_VIEWBOX.width} height={ERD_POSTER_VIEWBOX.height} fill="#f1f5f9" />
      <text
        x={ERD_POSTER_VIEWBOX.width / 2}
        y={52}
        textAnchor="middle"
        fill="#0f172a"
        fontSize={28}
        fontWeight={700}
        fontFamily="Arial, Helvetica, sans-serif"
        letterSpacing={1}
      >
        {ERD_POSTER_TITLE}
      </text>

      {ERD_POSTER_RELATIONS.map((rel) => (
        <PosterRelationLine key={`${rel.from}-${rel.to}`} rel={rel} />
      ))}

      {ERD_POSTER_ENTITIES.map((entity) => (
        <PosterEntityBox key={entity.id} entity={entity} />
      ))}

      <text
        x={ERD_POSTER_VIEWBOX.width / 2}
        y={ERD_POSTER_VIEWBOX.height - 24}
        textAnchor="middle"
        fill="#64748b"
        fontSize={12}
        fontFamily="Arial, sans-serif"
      >
        1 = one · M = many · PK = primary key · FK = foreign key
      </text>
    </svg>
  );
}

async function exportSvgToPng(svg: SVGSVGElement, filename: string, scale: number): Promise<void> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", String(ERD_POSTER_VIEWBOX.width));
  clone.setAttribute("height", String(ERD_POSTER_VIEWBOX.height));

  const serialized = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to render diagram for export."));
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = ERD_POSTER_VIEWBOX.width * scale;
    canvas.height = ERD_POSTER_VIEWBOX.height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported.");

    ctx.fillStyle = "#f1f5f9";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    await new Promise<void>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("PNG export failed."));
            return;
          }
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = filename;
          link.click();
          URL.revokeObjectURL(link.href);
          resolve();
        },
        "image/png",
        1,
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function DatabaseErdDiagram() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!svgRef.current || downloading) return;
    setDownloading(true);
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      await exportSvgToPng(
        svgRef.current,
        `mock-interview-pro-erd-${stamp}.png`,
        EXPORT_SCALE,
      );
    } catch {
      // silent — button re-enables
    } finally {
      setDownloading(false);
    }
  }, [downloading]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Classic ERD layout with 1/M cardinality — export at {ERD_POSTER_VIEWBOX.width * EXPORT_SCALE}×
          {ERD_POSTER_VIEWBOX.height * EXPORT_SCALE}px PNG.
        </p>
        <Button type="button" onClick={handleDownload} disabled={downloading} className="gap-2 shrink-0">
          <Download className="h-4 w-4" />
          {downloading ? "Generating…" : "Download PNG"}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-[#f1f5f9] p-4 shadow-inner">
        <div className="mx-auto aspect-[1280/820] w-full max-w-6xl min-w-[720px]">
          <PosterErdSvg svgRef={svgRef} />
        </div>
      </div>
    </div>
  );
}
