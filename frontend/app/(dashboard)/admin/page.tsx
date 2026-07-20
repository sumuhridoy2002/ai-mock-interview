"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  Globe,
  LayoutDashboard,
  Link2,
  MessageCircleQuestion,
  Mic,
  Trophy,
  Users,
  ChevronRight,
  Database,
} from "lucide-react";
import { PageHero, StatTile } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAdminStats, fetchAdminUsers, type AdminStats, type AdminUserRow } from "@/lib/admin";
import { formatScore } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchAdminStats(), fetchAdminUsers("", 1, 5)])
      .then(([statsRes, usersRes]) => {
        setStats(statsRes);
        setRecentUsers(usersRes.data ?? []);
      })
      .catch(() => {
        setStats(null);
        setRecentUsers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
        <PageHero
          icon={LayoutDashboard}
          title="Admin Dashboard"
          subtitle="Platform overview — candidates, interviews, and public talent discovery."
          accent="indigo"
        />

        {loading ? (
          <p className="text-muted-foreground">Loading dashboard…</p>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatTile icon={Users} label="Candidates" value={stats.total_candidates} accent="indigo" />
              <StatTile icon={Mic} label="Interviews" value={stats.total_interviews} accent="violet" />
              <StatTile
                icon={Trophy}
                label="Completed"
                value={stats.completed_interviews}
                accent="emerald"
              />
              <StatTile icon={Globe} label="Public profiles" value={stats.public_profiles} accent="amber" />
              <StatTile
                icon={Activity}
                label="On leaderboard"
                value={stats.on_leaderboard}
                accent="indigo"
              />
              <StatTile icon={Link2} label="Active share links" value={stats.active_share_links} accent="violet" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">Recent candidates</CardTitle>
                  <Link href="/admin/users" className="text-sm text-primary hover:underline flex items-center gap-1">
                    View all <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </CardHeader>
                <CardContent className="divide-y divide-border">
                  {recentUsers.length === 0 ? (
                    <p className="py-4 text-sm text-muted-foreground">No candidates registered yet.</p>
                  ) : (
                    recentUsers.map((user) => (
                      <Link
                        key={user.id}
                        href={`/admin/users/${user.id}`}
                        className="flex items-center justify-between gap-3 py-3 hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="font-medium truncate">{user.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-medium">
                            {user.average_score != null ? formatScore(user.average_score) : "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.completed_count}/{user.interview_count} done
                          </p>
                        </div>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { href: "/admin/users", label: "Manage candidates", icon: Users },
                    { href: "/admin/erd", label: "Database ERD", icon: Database },
                    { href: "/system/metrics", label: "System metrics", icon: Activity },
                    { href: "/system/expert", label: "AI Expert", icon: MessageCircleQuestion },
                    { href: "/", label: "Public leaderboard", icon: Trophy },
                  ].map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 hover:bg-muted/40 transition-colors"
                    >
                      <Icon className="h-4 w-4 text-indigo-500" />
                      <span className="flex-1 text-sm font-medium">{label}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground">Could not load dashboard stats.</p>
        )}
      </div>
  );
}
