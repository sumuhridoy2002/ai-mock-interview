"use client";

import Link from "next/link";
import { Workflow, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SystemMethodologyDiagram } from "@/components/system/system-methodology-diagram";

const RELATED_LINKS = [
  { href: "/system/features", label: "Feature catalog" },
  { href: "/system/stack", label: "Technology stack" },
  { href: "/system/compare", label: "Compare platforms" },
  { href: "/system/metrics", label: "Performance metrics" },
] as const;

export function SystemHowItWorksView() {
  return (
    <div className="w-full space-y-5">
      <div>
        <PageHeader
          size="md"
          icon={Workflow}
          title="How It Works"
          subtitle="Register, login, profile, live interview, AI evaluation, vision behavior, mastery memory, and PDF reports — user journey and runtime architecture."
        />
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {RELATED_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              {label}
              <ArrowRight className="h-3 w-3" />
            </Link>
          ))}
        </div>
      </div>

      <SystemMethodologyDiagram />
    </div>
  );
}
