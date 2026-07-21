"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PublicProfileView } from "@/components/public/public-profile-view";
import { fetchPublicProfile, type PublicProfile } from "@/lib/public-profiles";

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
    <div className="min-h-screen bg-background" data-page-export-root>
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to leaderboard
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <span className="font-semibold text-sm">Mock Interview Pro</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-48 rounded-3xl bg-muted" />
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="h-64 rounded-xl bg-muted lg:col-span-2" />
              <div className="h-64 rounded-xl bg-muted" />
            </div>
          </div>
        ) : error || !profile ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              {error || "Profile not found."}
            </CardContent>
          </Card>
        ) : (
          <PublicProfileView profile={profile} />
        )}
      </main>
    </div>
  );
}
