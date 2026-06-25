"use client";

import Link from "next/link";
import { Workflow, ArrowRight } from "lucide-react";
import { SystemMethodologyDiagram } from "@/components/system/system-methodology-diagram";

export function SystemHowItWorksView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Workflow className="h-6 w-6 text-indigo-400" />
          How It Works
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          End-to-end user journey and runtime architecture — from registration through live interview
          to AI evaluation and PDF report.
        </p>
        <Link
          href="/system/features"
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300"
        >
          See full feature list
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <SystemMethodologyDiagram />
    </div>
  );
}
