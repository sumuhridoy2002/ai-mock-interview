"use client";

import Link from "next/link";
import { Workflow, ArrowRight } from "lucide-react";
import { PageHero } from "@/components/ui/page-shell";
import { SystemMethodologyDiagram } from "@/components/system/system-methodology-diagram";

const RELATED_LINKS = [
  { href: "/system/features", label: "Feature catalog" },
  { href: "/system/stack", label: "Technology stack" },
  { href: "/system/compare", label: "Compare platforms" },
  { href: "/system/metrics", label: "Performance metrics" },
] as const;

export function SystemHowItWorksView() {
  return (
    <div className="w-full space-y-6">
      <PageHero
        icon={Workflow}
        title="How It Works"
        subtitle="Register, login, profile, live interview, AI evaluation, vision behavior, mastery memory, and PDF reports."
        accent="violet"
      >
        <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
          {RELATED_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex items-center gap-1 rounded-xl bg-white/15 px-3 py-1.5 text-sm font-semibold text-white ring-1 ring-white/25 hover:bg-white/25 transition-colors"
            >
              {label}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ))}
        </div>
      </PageHero>

      <SystemMethodologyDiagram />
    </div>
  );
}
