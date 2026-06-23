"use client";

import { useState } from "react";
import { Server } from "lucide-react";
import { SYSTEM_COMPONENTS } from "@/lib/system-architecture";

function TechnologyBadge({ technology, category }: { technology: string; category: string }) {
  return (
    <div className="text-right shrink-0">
      <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-medium text-indigo-300">
        {technology}
      </span>
      <p className="text-[10px] text-slate-600 mt-0.5">{category}</p>
    </div>
  );
}

function ComponentRow({ component }: { component: (typeof SYSTEM_COMPONENTS)[number] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-slate-700/40 bg-slate-900/50 px-4 py-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-3 text-left"
      >
        <p className="text-sm font-semibold text-slate-200">{component.name}</p>
        <TechnologyBadge technology={component.technology} category={component.category} />
      </button>
      {open && (
        <div className="mt-3 pt-3 border-t border-slate-800 space-y-1.5 text-xs text-slate-500">
          <p><span className="text-slate-400 font-medium">Role:</span> {component.role}</p>
          <p><span className="text-slate-400 font-medium">Stack:</span> {component.stack}</p>
          <p className="font-mono text-[11px] break-all">
            <span className="text-slate-400 font-medium font-sans">Endpoint:</span> {component.endpoint}
          </p>
        </div>
      )}
    </div>
  );
}

export function SystemStackView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Server className="h-6 w-6 text-indigo-400" />
          Technology Stack
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Every layer in Mock Interview Pro — tap a row to see role, stack, and endpoint.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {SYSTEM_COMPONENTS.map((component) => (
          <ComponentRow key={component.id} component={component} />
        ))}
      </div>
    </div>
  );
}
