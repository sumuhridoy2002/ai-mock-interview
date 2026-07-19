"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Database, Key, Link2, Search } from "lucide-react";
import { PageHero } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ERD_GROUPS,
  ERD_RELATIONS,
  ERD_TABLES,
  filterTables,
  getRelationsForTables,
  type ColumnKind,
  type ErdGroupId,
  type ErdTable,
} from "@/lib/database-erd";
import { cn } from "@/lib/utils";

const GROUP_ACCENT: Record<string, string> = {
  indigo: "border-indigo-500/40 bg-indigo-500/5",
  violet: "border-violet-500/40 bg-violet-500/5",
  emerald: "border-emerald-500/40 bg-emerald-500/5",
  amber: "border-amber-500/40 bg-amber-500/5",
  sky: "border-sky-500/40 bg-sky-500/5",
  slate: "border-slate-500/40 bg-slate-500/5",
};

const GROUP_HEADER: Record<string, string> = {
  indigo: "text-indigo-600 dark:text-indigo-400",
  violet: "text-violet-600 dark:text-violet-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
  sky: "text-sky-600 dark:text-sky-400",
  slate: "text-slate-600 dark:text-slate-400",
};

const KIND_BADGE: Record<ColumnKind, string> = {
  pk: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  fk: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  uk: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  col: "bg-muted text-muted-foreground",
};

const PIPELINE_FLOW = [
  "users",
  "resumes",
  "interviews",
  "interview_sessions",
  "interview_questions",
  "interview_answers",
  "interview_scores",
  "interview_reports",
] as const;

function ColumnBadge({ kind }: { kind?: ColumnKind }) {
  const label = kind === "pk" ? "PK" : kind === "fk" ? "FK" : kind === "uk" ? "UK" : null;
  if (!label) return null;

  return (
    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold uppercase", KIND_BADGE[kind ?? "col"])}>
      {label}
    </span>
  );
}

function ErdTableCard({ table }: { table: ErdTable }) {
  const group = ERD_GROUPS.find((item) => item.id === table.group);

  return (
    <Card
      id={`table-${table.name}`}
      className={cn("overflow-hidden scroll-mt-24", group && GROUP_ACCENT[group.accent])}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-mono">
          <Database className="h-4 w-4 shrink-0 opacity-70" />
          {table.name}
        </CardTitle>
        <p className="text-xs text-muted-foreground leading-relaxed">{table.description}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="divide-y divide-border/60 rounded-lg border border-border/60 bg-card/50">
          {table.columns.map((column) => (
            <li
              key={column.name}
              className="flex items-start justify-between gap-2 px-3 py-2 text-xs font-mono"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <ColumnBadge kind={column.kind} />
                  <span className="font-semibold text-foreground">{column.name}</span>
                </div>
                {column.note && (
                  <p className="mt-0.5 text-[10px] text-muted-foreground normal-case">{column.note}</p>
                )}
              </div>
              <span className="shrink-0 text-muted-foreground">{column.type}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function DatabaseErdView() {
  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState<ErdGroupId | "all">("all");

  const visibleTables = useMemo(() => filterTables(query, activeGroup), [query, activeGroup]);
  const visibleNames = useMemo(() => new Set(visibleTables.map((table) => table.name)), [visibleTables]);
  const visibleRelations = useMemo(() => getRelationsForTables(visibleNames), [visibleNames]);

  const pipelineTables = useMemo(
    () => PIPELINE_FLOW.map((name) => ERD_TABLES.find((table) => table.name === name)).filter(Boolean) as ErdTable[],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHero
        icon={Database}
        title="Database ERD"
        subtitle={`Full entity-relationship diagram — ${ERD_TABLES.length} tables across auth, interviews, scoring, AI memory, sharing, and Laravel framework.`}
        accent="indigo"
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tables or columns…"
            className="pl-9"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Showing {visibleTables.length} of {ERD_TABLES.length} tables · {ERD_RELATIONS.length} relationships
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveGroup("all")}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            activeGroup === "all"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card hover:bg-muted",
          )}
        >
          All tables
        </button>
        {ERD_GROUPS.map((group) => (
          <button
            key={group.id}
            type="button"
            onClick={() => setActiveGroup(group.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              activeGroup === group.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:bg-muted",
            )}
          >
            {group.label}
          </button>
        ))}
      </div>

      {(activeGroup === "all" || activeGroup === "interview") && !query && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="h-4 w-4 text-indigo-500" />
              Core interview pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto pb-2">
              <div className="flex min-w-max items-center gap-2">
                {pipelineTables.map((table, index) => (
                  <div key={table.name} className="flex items-center gap-2">
                    <a
                      href={`#table-${table.name}`}
                      className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs font-mono font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20 transition-colors"
                    >
                      {table.name}
                    </a>
                    {index < pipelineTables.length - 1 && (
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Side branches: interview_answers → interview_scores, answer_behaviors · interviews →
              interview_reports · interview_sessions → agent_memories
            </p>
          </CardContent>
        </Card>
      )}

      {visibleRelations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="h-4 w-4 text-violet-500" />
              Relationships
              {activeGroup !== "all" && (
                <span className="text-xs font-normal text-muted-foreground">(in current view)</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">From</th>
                    <th className="px-4 py-3 font-medium">To</th>
                    <th className="px-4 py-3 font-medium">Label</th>
                    <th className="px-4 py-3 font-medium">Cardinality</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRelations.map((relation, index) => (
                    <tr key={`${relation.from}-${relation.to}-${relation.label}-${index}`} className="border-b border-border/60">
                      <td className="px-4 py-2.5 font-mono text-xs">{relation.from}</td>
                      <td className="px-4 py-2.5 font-mono text-xs">{relation.to}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{relation.label}</td>
                      <td className="px-4 py-2.5 font-mono text-xs">{relation.cardinality}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeGroup === "all" && !query ? (
        ERD_GROUPS.map((group) => {
          const groupTables = ERD_TABLES.filter((table) => table.group === group.id);
          if (groupTables.length === 0) return null;

          return (
            <section key={group.id} className="space-y-4">
              <div>
                <h2 className={cn("text-lg font-semibold", GROUP_HEADER[group.accent])}>{group.label}</h2>
                <p className="text-sm text-muted-foreground">{group.description}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {groupTables.map((table) => (
                  <ErdTableCard key={table.name} table={table} />
                ))}
              </div>
            </section>
          );
        })
      ) : visibleTables.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No tables match your search in this group.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleTables.map((table) => (
            <ErdTableCard key={table.name} table={table} />
          ))}
        </div>
      )}
    </div>
  );
}
