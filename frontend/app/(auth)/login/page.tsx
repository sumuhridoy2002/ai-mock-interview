"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { login, getStoredUser, isAdmin } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      const stored = getStoredUser();
      router.push(isAdmin(stored) ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-gradient-to-br from-slate-50 via-indigo-50/50 to-violet-50 dark:from-slate-950 dark:via-indigo-950/40 dark:to-violet-950/30">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md" data-page-export-root>
      <Card className="w-full max-w-md overflow-hidden border-2 border-primary/20 shadow-2xl shadow-primary/10">
        <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-800 px-6 py-8 text-center text-white">
          <div className="flex justify-center mb-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
              <Sparkles className="h-7 w-7" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-indigo-100 text-sm mt-1">Sign in to practice your next interview</p>
        </div>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Password</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full font-semibold" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
