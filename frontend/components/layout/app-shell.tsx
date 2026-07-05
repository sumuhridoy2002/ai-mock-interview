"use client";

import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { Menu, Sparkles } from "lucide-react";
import { getToken, logout } from "@/lib/auth";
import { useScheduledInterviewAlarm } from "@/hooks/useScheduledInterviewAlarm";
import { AlarmBanner } from "@/components/layout/alarm-banner";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { firedAlarms, stopRinging } = useScheduledInterviewAlarm();

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      await logout();
    } catch {
      // token is already cleared by logout()'s finally block
    }
    router.push("/login");
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex bg-background">
        <div className="hidden lg:block w-[272px] shrink-0 border-r border-border bg-card/50" />
        <div className="flex flex-1 flex-col">
          <div className="h-14 border-b border-border bg-card/80 lg:hidden" />
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
              Loading workspace…
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <AlarmBanner alarms={firedAlarms} onStop={stopRinging} />

      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur-xl lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="truncate text-sm font-semibold text-foreground">Mock Interview Pro</span>
        </div>
        <ThemeToggle className="scale-90" />
      </header>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm lg:hidden"
          onClick={closeMobile}
          aria-label="Close menu"
        />
      )}

      <div className="flex min-h-screen bg-background">
        <DashboardSidebar
          mobileOpen={mobileOpen}
          onMobileClose={closeMobile}
          onSignOut={handleSignOut}
        />
        <main className="flex-1 overflow-auto pt-14 lg:pt-0 text-sm leading-relaxed">
          <div className="mx-auto max-w-7xl p-5 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </>
  );
}
