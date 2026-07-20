"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Search, Users, ChevronRight, ChevronLeft } from "lucide-react";
import { PageHero } from "@/components/ui/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAdminUsers, type AdminUserRow } from "@/lib/admin";
import { formatScore } from "@/lib/utils";

const PER_PAGE = 20;

function AdminUsersTableSkeleton() {
  return (
    <>
      {Array.from({ length: PER_PAGE }).map((_, index) => (
        <tr key={`skeleton-${index}`} className="border-b border-border/60">
          <td className="px-4 py-3">
            <Skeleton className="h-4 w-36" />
          </td>
          <td className="px-4 py-3">
            <Skeleton className="h-4 w-48" />
          </td>
          <td className="px-4 py-3">
            <Skeleton className="h-4 w-12" />
          </td>
          <td className="px-4 py-3">
            <Skeleton className="h-4 w-10" />
          </td>
          <td className="px-4 py-3">
            <Skeleton className="h-4 w-14" />
          </td>
          <td className="px-4 py-3">
            <div className="flex justify-end">
              <Skeleton className="h-4 w-12" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (term: string, pageNumber: number) => {
    setLoading(true);
    try {
      const res = await fetchAdminUsers(term, pageNumber, PER_PAGE);
      setUsers(res.data ?? []);
      setCurrentPage(res.current_page ?? pageNumber);
      setLastPage(res.last_page ?? 1);
      setTotal(res.total ?? 0);
    } catch {
      setUsers([]);
      setCurrentPage(1);
      setLastPage(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(query, page);
  }, [load, query, page]);

  const handleSearch = () => {
    setPage(1);
    setQuery(search);
  };

  const from = total === 0 ? 0 : (currentPage - 1) * PER_PAGE + 1;
  const to = Math.min(currentPage * PER_PAGE, total);

  return (
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
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
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
                    <AdminUsersTableSkeleton />
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

            {(loading || total > 0) && (
              <div className="flex flex-col items-center gap-3 border-t border-border px-4 py-4">
                <p className="text-sm text-muted-foreground">
                  {loading && total === 0
                    ? "Loading candidates…"
                    : `Showing ${from}–${to} of ${total} candidates`}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={loading || currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="min-w-[7rem] text-center text-sm text-muted-foreground">
                    Page {currentPage} of {lastPage}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={loading || currentPage >= lastPage}
                    onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
