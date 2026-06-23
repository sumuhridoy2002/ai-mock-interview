"use client";

import { ArrowRight, Database, Mic, Server, Sparkles, Upload, UserPlus } from "lucide-react";
import { SYSTEM_COMPONENTS } from "@/lib/system-architecture";

const USER_FLOW = [
  { icon: UserPlus, label: "Register", detail: "Create account · welcome email queued" },
  { icon: Upload, label: "Upload CV", detail: "PDF/DOCX parsed for skills & experience" },
  { icon: Sparkles, label: "Setup interview", detail: "Job title, description, schedule or start now" },
  { icon: Mic, label: "Live interview", detail: "Voice/video answers · Whisper STT · Ollama scoring" },
  { icon: Database, label: "Report", detail: "Scores, PDF report, structured explanations" },
];

export function SystemMethodologyDiagram() {
  const serverComponents = SYSTEM_COMPONENTS.filter((c) => c.kind === "server");
  const clientComponents = SYSTEM_COMPONENTS.filter((c) => c.kind === "client");

  return (
    <div className="space-y-4">
      {/* User journey */}
      <div>
        <h4 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-2">
          End-to-end flow
        </h4>
        <div className="flex flex-wrap items-center gap-1">
          {USER_FLOW.map((step, i) => (
            <div key={step.label} className="flex items-center gap-1">
              <div className="rounded-lg border border-slate-700/50 bg-slate-900/60 px-2.5 py-2 min-w-[100px]">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <step.icon className="h-3 w-3 text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-200">{step.label}</span>
                </div>
                <p className="text-[9px] text-slate-500 leading-snug">{step.detail}</p>
              </div>
              {i < USER_FLOW.length - 1 && (
                <ArrowRight className="h-3 w-3 text-slate-600 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Runtime architecture */}
      <div>
        <h4 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-2">
          Runtime architecture
        </h4>
        <div className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-3 space-y-3">
          <div>
            <p className="text-[9px] uppercase text-cyan-500/80 mb-1.5 font-medium">Browser</p>
            <div className="grid grid-cols-1 gap-1.5">
              {clientComponents.map((c) => (
                <div key={c.id} className="flex items-start justify-between gap-2 text-[10px] rounded bg-slate-800/50 px-2 py-1.5">
                  <div>
                    <span className="text-slate-200 font-medium">{c.name}</span>
                    <span className="text-slate-500 ml-1">· {c.technology}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowRight className="h-4 w-4 text-slate-600 rotate-90" />
          </div>

          <div>
            <p className="text-[9px] uppercase text-violet-400/80 mb-1.5 font-medium flex items-center gap-1">
              <Server className="h-3 w-3" /> Server stack
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {serverComponents.map((c) => (
                <div key={c.id} className="rounded bg-slate-800/50 px-2 py-1.5 text-[10px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-200 font-medium">{c.name}</span>
                    <span className="text-indigo-300/90 shrink-0">{c.technology}</span>
                  </div>
                  <p className="text-slate-500 mt-0.5">{c.role}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[9px] text-slate-600 pt-1 border-t border-slate-800">
            Next.js → Laravel API (REST) · Queue → FastAPI → Ollama/Whisper · Reverb → browser WebSocket
          </p>
        </div>
      </div>
    </div>
  );
}
