"use client";

import { Sparkles } from "lucide-react";
import { PageHero } from "@/components/ui/page-shell";
import { ExpertChatPanel } from "@/components/system/expert-chat-panel";

export default function SystemExpertPage() {
  return (
    <div className="w-full space-y-6">
        <PageHero
          icon={Sparkles}
          title="AI Expert"
          subtitle="Ask about scoring, evaluation methodology, behavior analysis, and interview strategy."
          accent="violet"
        />
        <ExpertChatPanel />
      </div>
  );
}
