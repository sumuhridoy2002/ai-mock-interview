"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Mic,
  User,
  LogOut,
  Sparkles,
  Plus,
  X,
  ChevronRight,
  Activity,
  Server,
  GitCompare,
  Workflow,
} from "lucide-react";
import { fetchUser, getStoredUser, type User as AuthUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        description: "Progress & analytics",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Preparation",
    items: [
      {
        href: "/resume/upload",
        label: "Resume",
        description: "Upload & parse CV",
        icon: FileText,
      },
      {
        href: "/interview/setup",
        label: "Interview",
        description: "Schedule or start",
        icon: Mic,
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        href: "/system/metrics",
        label: "Metrics",
        description: "Performance scores",
        icon: Activity,
      },
      {
        href: "/system/stack",
        label: "Stack",
        description: "Technology layers",
        icon: Server,
      },
      {
        href: "/system/compare",
        label: "Compare",
        description: "vs other platforms",
        icon: GitCompare,
      },
      {
        href: "/system/how-it-works",
        label: "How it works",
        description: "Architecture & flow",
        icon: Workflow,
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        href: "/profile",
        label: "Profile",
        description: "Account settings",
        icon: User,
      },
    ],
  },
];

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/interview/setup") return pathname.startsWith("/interview");
  if (href.startsWith("/system/")) return pathname === href || pathname.startsWith(`${href}/`);
  return pathname.startsWith(href);
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface DashboardSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  onSignOut: () => void;
}

export function DashboardSidebar({
  mobileOpen,
  onMobileClose,
  onSignOut,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());

  useEffect(() => {
    fetchUser().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    onMobileClose();
  }, [pathname, onMobileClose]);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-slate-800/80 bg-slate-950/98 backdrop-blur-xl transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 lg:shrink-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
      )}
      aria-label="Main navigation"
    >
      {/* Brand */}
      <div className="flex h-[4.25rem] items-center justify-between gap-3 border-b border-slate-800/80 px-5">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-3 group">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-white group-hover:text-indigo-200 transition-colors">
              Mock Interview Pro
            </p>
            <p className="truncate text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Interview prep
            </p>
          </div>
        </Link>
        <button
          type="button"
          onClick={onMobileClose}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Primary CTA */}
      <div className="px-4 pt-5 pb-2">
        <Link
          href="/interview/setup"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 ring-1 ring-white/10 transition-all hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-500/30 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          New Interview
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="mb-6 last:mb-2">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ href, label, description, icon: Icon }) => {
                const active = isNavActive(pathname, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all",
                        active
                          ? "bg-indigo-500/10 text-white shadow-sm ring-1 ring-indigo-500/20"
                          : "text-slate-400 hover:bg-slate-900/80 hover:text-slate-100",
                      )}
                    >
                      {active && (
                        <span
                          className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-indigo-400"
                          aria-hidden
                        />
                      )}
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                          active
                            ? "bg-indigo-500/20 text-indigo-300"
                            : "bg-slate-800/80 text-slate-500 group-hover:bg-slate-800 group-hover:text-slate-300",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium leading-tight">{label}</span>
                        <span
                          className={cn(
                            "block truncate text-[11px] leading-tight mt-0.5",
                            active ? "text-indigo-300/70" : "text-slate-600 group-hover:text-slate-500",
                          )}
                        >
                          {description}
                        </span>
                      </span>
                      {active && (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-indigo-400/60" aria-hidden />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-800/80 p-3">
        <div className="rounded-xl bg-slate-900/50 p-2.5 ring-1 ring-slate-800/80">
          <div className="flex items-center gap-2.5">
            <Link
              href="/profile"
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg p-1 transition-colors hover:bg-slate-800/50"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-800 text-xs font-bold text-white ring-2 ring-slate-700/80">
                {user ? getInitials(user.name) : "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-200">
                  {user?.name ?? "Loading…"}
                </p>
                <p className="truncate text-[11px] text-slate-500">{user?.email ?? ""}</p>
              </div>
            </Link>
            <button
              type="button"
              onClick={onSignOut}
              className="shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
