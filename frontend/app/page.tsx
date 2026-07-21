"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Sparkles, Trophy, ArrowRight, LayoutDashboard, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchLeaderboard, type LeaderboardEntry } from "@/lib/public-profiles";
import { fetchUser, getStoredUser, getToken, isAdmin } from "@/lib/auth";
import { formatScore } from "@/lib/utils";

export default function HomePage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    fetchLeaderboard(100)
      .then(setLeaderboard)
      .catch(() => setLeaderboard([]))
      .finally(() => setLoading(false));

    if (getToken()) {
      setLoggedIn(true);
      const stored = getStoredUser();
      if (isAdmin(stored)) setAdmin(true);
      fetchUser()
        .then((u) => setAdmin(isAdmin(u)))
        .catch(() => {});
    }
  }, []);

  return (
    <div className="min-h-screen bg-background" data-page-export-root>
      <header className="border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">Mock Interview Pro</span>
          </Link>
          <nav className="flex items-center gap-2">
            {loggedIn ? (
              <>
                {admin && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm">
                      <Shield className="h-4 w-4 mr-1" /> Admin
                    </Button>
                  </Link>
                )}
                <Link href="/dashboard">
                  <Button size="sm">
                    <LayoutDashboard className="h-4 w-4 mr-1" /> Dashboard
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" size="sm">Log in</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Get started</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-12 space-y-12">
        <section className="text-center space-y-6 max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            AI mock interviews with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
              real-time feedback
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Practice technical and behavioral interviews, track your scores, and optionally
            showcase your performance to recruiters on our public talent leaderboard.
          </p>
          {!loggedIn && (
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Start practicing <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h2 className="text-2xl font-semibold">Top performers</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Candidates who opt in to the public leaderboard. Rankings are based on average
            interview scores.
          </p>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium w-16">Rank</th>
                      <th className="px-4 py-3 font-medium">Candidate</th>
                      <th className="px-4 py-3 font-medium">Headline</th>
                      <th className="px-4 py-3 font-medium">Avg score</th>
                      <th className="px-4 py-3 font-medium">Completed</th>
                      <th className="px-4 py-3 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                          Loading leaderboard…
                        </td>
                      </tr>
                    ) : leaderboard.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                          No public profiles yet. Enable leaderboard visibility from your profile
                          after completing interviews.
                        </td>
                      </tr>
                    ) : (
                      leaderboard.map((entry) => (
                        <tr key={entry.slug} className="border-b border-border/60 hover:bg-muted/30">
                          <td className="px-4 py-3 font-mono text-muted-foreground">#{entry.rank}</td>
                          <td className="px-4 py-3 font-medium">{entry.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {entry.headline || "—"}
                          </td>
                          <td className="px-4 py-3">{formatScore(entry.average_score)}</td>
                          <td className="px-4 py-3">{entry.completed_count}</td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/public/profiles/${entry.slug}`}
                              className="text-primary hover:underline inline-flex items-center gap-1"
                            >
                              Profile <ArrowRight className="h-3.5 w-3.5" />
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
        </section>
      </main>
    </div>
  );
}
