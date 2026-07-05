"use client";

import Link from "next/link";
import { Workflow, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SystemMethodologyDiagram } from "@/components/system/system-methodology-diagram";

export function SystemHowItWorksView() {
  return (
    <div className="space-y-6">
      <div>
        <PageHeader
          size="md"
          icon={Workflow}
          title="How It Works"
          subtitle="End-to-end user journey and runtime architecture — from registration through live interview to AI evaluation and PDF report."
        />
        <Link
          href="/system/features"
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          See full feature list
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <SystemMethodologyDiagram />
    </div>
  );
}
