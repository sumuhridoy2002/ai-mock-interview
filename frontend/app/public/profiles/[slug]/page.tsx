"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchPublicProfile, type PublicProfile } from "@/lib/public-profiles";
import { formatScore } from "@/lib/utils";

export default function PublicProfilePage() {
  const params = useParams();
  const slug = String(params.slug);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicProfile(slug)
      .then(setProfile)
      .catch((err) => setError(err instanceof Error ? err.message : "Profile not found."))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to leaderboard
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <span className="font-semibold text-sm">Mock Interview Pro</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10">
        {loading ? (
          <p className="text-muted-foreground">Loading profile…</p>
        ) : error || !profile ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              {error || "Profile not found."}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">{profile.name}</h1>
              {profile.headline && (
                <p className="mt-2 text-lg text-muted-foreground">{profile.headline}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    <Trophy className="h-4 w-4" /> Average score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {profile.average_score != null ? formatScore(profile.average_score) : "—"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Completed interviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{profile.completed_count}</p>
                </CardContent>
              </Card>
            </div>

            {profile.skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-muted px-3 py-1 text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="text-center pt-4">
              <Link href="/register">
                <Button>Start your mock interviews</Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
