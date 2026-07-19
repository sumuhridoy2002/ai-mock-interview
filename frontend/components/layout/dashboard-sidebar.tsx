"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  List,
  MessageCircleQuestion,
  Users,
} from "lucide-react";
import { fetchUser, getStoredUser, isAdmin, type User as AuthUser } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
  adminOnly?: boolean;
  candidateOnly?: boolean;
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
    candidateOnly: true,
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
    title: "AI Coach",
    items: [
      {
        href: "/system/expert",
        label: "AI Expert",
        description: "Ask about scoring & strategy",
        icon: MessageCircleQuestion,
      },
    ],
  },
  {
    title: "Admin",
    adminOnly: true,
    items: [
      {
        href: "/admin/users",
        label: "User Management",
        description: "Browse candidates",
        icon: Users,
        adminOnly: true,
      },
    ],
  },
  {
    title: "System",
    adminOnly: true,
    items: [
      {
        href: "/system/metrics",
        label: "Metrics",
        description: "Performance scores",
        icon: Activity,
        adminOnly: true,
      },
      {
        href: "/system/stack",
        label: "Stack",
        description: "Technology layers",
        icon: Server,
        adminOnly: true,
      },
      {
        href: "/system/compare",
        label: "Compare",
        description: "vs other platforms",
        icon: GitCompare,
        adminOnly: true,
      },
      {
        href: "/system/features",
        label: "Features",
        description: "Full capability list",
        icon: List,
        adminOnly: true,
      },
      {
        href: "/system/how-it-works",
        label: "How it works",
        description: "Architecture & flow",
        icon: Workflow,
        adminOnly: true,
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
  if (href === "/admin") return pathname === "/admin";
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/interview/setup") return pathname.startsWith("/interview");
  if (href.startsWith("/admin/")) return pathname === href || pathname.startsWith(`${href}/`);
  if (href.startsWith("/system/")) return pathname === href || pathname.startsWith(`${href}/`);
  return pathname.startsWith(href);
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

  const visibleGroups = useMemo(() => {
    const admin = isAdmin(user);
    return NAV_GROUPS.filter((group) => {
      if (group.adminOnly && !admin) return false;
      if (group.candidateOnly && admin) return false;
      return true;
    }).map((group) => {
      if (admin && group.title === "Overview") {
        return {
          ...group,
          items: [
            {
              href: "/admin",
              label: "Dashboard",
              description: "Platform overview",
              icon: LayoutDashboard,
            },
          ],
        };
      }
      return {
        ...group,
        items: group.items.filter((item) => !item.adminOnly || admin),
      };
    });
  }, [user]);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-border bg-card/98 backdrop-blur-xl transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 lg:shrink-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
      )}
      aria-label="Main navigation"
    >
      {/* Brand */}
      <div className="flex h-[4.25rem] items-center justify-between gap-3 border-b border-border px-5">
        <Link href={isAdmin(user) ? "/admin" : "/dashboard"} className="flex min-w-0 items-center gap-3 group">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
              Mock Interview Pro
            </p>
            <p className="truncate text-sm font-medium uppercase tracking-wider text-muted-foreground">
              {isAdmin(user) ? "Admin workspace" : "Interview prep"}
            </p>
          </div>
        </Link>
        <button
          type="button"
          onClick={onMobileClose}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Primary CTA — candidates only */}
      {!isAdmin(user) && (
        <div className="px-4 pt-5 pb-2">
          <Link
            href="/interview/setup"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 ring-1 ring-white/10 transition-all hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-500/30 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            New Interview
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin">
        {visibleGroups.map((group) => (
          <div key={group.title} className="mb-6 last:mb-2">
            <p className="mb-2 px-3 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
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
                          ? "bg-gradient-to-r from-primary/15 to-violet-500/10 text-foreground shadow-md ring-1 ring-primary/30"
                          : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                      )}
                    >
                      {active && (
                        <span
                          className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                          aria-hidden
                        />
                      )}
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                          active
                            ? "bg-gradient-to-br from-primary to-violet-600 text-white shadow-md"
                            : "bg-muted/80 text-muted-foreground group-hover:bg-muted group-hover:text-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium leading-tight">{label}</span>
                        <span
                          className={cn(
                            "block truncate text-sm leading-tight mt-0.5",
                            active ? "text-primary/80" : "text-muted-foreground",
                          )}
                        >
                          {description}
                        </span>
                      </span>
                      {active && (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary/50" aria-hidden />
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
      <div className="border-t border-border p-3 space-y-2">
        <div className="hidden lg:flex justify-center">
          <ThemeToggle />
        </div>
        <div className="rounded-xl bg-muted/40 p-2.5 ring-1 ring-border">
          <div className="flex items-center gap-2.5">
            <Link
              href="/profile"
              className="flex min-w-0 flex-1 items-center rounded-lg p-1 transition-colors hover:bg-muted/80"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {user?.name ?? "Loading…"}
                </p>
                <p className="truncate text-sm text-muted-foreground">{user?.email ?? ""}</p>
              </div>
            </Link>
            <button
              type="button"
              onClick={onSignOut}
              className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
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
