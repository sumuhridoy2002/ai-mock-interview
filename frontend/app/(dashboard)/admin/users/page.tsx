"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Search, Users, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHero } from "@/components/ui/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchAdminUsers, type AdminUserRow } from "@/lib/admin";
import { formatScore } from "@/lib/utils";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (term: string) => {
    setLoading(true);
    try {
      const res = await fetchAdminUsers(term);
      setUsers(res.data ?? []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(query);
  }, [load, query]);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHero
          icon={Users}
          title="User Management"
          subtitle="Browse candidates, review performance, and manage public sharing."
          accent="violet"
        />

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setQuery(search)}
            placeholder="Search by name or email…"
            className="pl-9"
          />
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Interviews</th>
                    <th className="px-4 py-3 font-medium">Avg score</th>
                    <th className="px-4 py-3 font-medium">Public</th>
                    <th className="px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        Loading users…
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="border-b border-border/60 hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{user.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                        <td className="px-4 py-3">
                          {user.completed_count}/{user.interview_count}
                        </td>
                        <td className="px-4 py-3">
                          {user.average_score != null ? formatScore(user.average_score) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {user.is_profile_public ? (
                            <span className="text-emerald-600 dark:text-emerald-400">Public</span>
                          ) : (
                            <span className="text-muted-foreground">Private</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            View <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
