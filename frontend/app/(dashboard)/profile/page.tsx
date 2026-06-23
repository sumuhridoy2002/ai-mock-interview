"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchUser, getStoredUser, User } from "@/lib/auth";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(getStoredUser());

  useEffect(() => {
    fetchUser().then(setUser).catch(() => {});
  }, []);

  return (
    <AppShell>
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Profile</h1>
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-400">Name</p>
              <p className="text-white">{user?.name}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Email</p>
              <p className="text-white">{user?.email}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
