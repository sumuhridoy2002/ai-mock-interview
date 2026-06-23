"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Mic,
  User,
  LogOut,
  Sparkles,
} from "lucide-react";
import { getToken, logout } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useScheduledInterviewAlarm } from "@/hooks/useScheduledInterviewAlarm";
import { AlarmBanner } from "@/components/layout/alarm-banner";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/resume/upload", label: "Resume", icon: FileText },
  { href: "/interview/setup", label: "Interview", icon: Mic },
  { href: "/profile", label: "Profile", icon: User },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const { firedAlarms, stopRinging } = useScheduledInterviewAlarm();

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-300">
        Loading...
      </div>
    );
  }

  return (
    <>
      <AlarmBanner alarms={firedAlarms} onStop={stopRinging} />
      <div className="min-h-full flex">
      <aside className="w-64 border-r border-slate-700/50 bg-slate-900/80 backdrop-blur p-4 flex flex-col shrink-0">
        <div className="flex items-center gap-2 px-2 mb-8">
          <Sparkles className="h-6 w-6 text-indigo-400" />
          <span className="font-bold text-white">Mock Interview Pro</span>
        </div>
        <nav className="space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                pathname.startsWith(href)
                  ? "bg-indigo-600/20 text-indigo-300"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 rounded-lg border border-slate-700/70 bg-slate-900/70 px-3 py-2 h-auto text-sm text-slate-300 hover:bg-rose-500/10 hover:border-rose-500/60 hover:text-rose-200 transition-colors"
            onClick={async () => {
              await logout();
              router.push("/login");
            }}
          >
            <LogOut className="h-4 w-4 text-rose-300" />
            Sign out
          </Button>
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </>
  );
}
