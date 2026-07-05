"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";
import { changePassword, fetchUser, getStoredUser, updateProfile, User } from "@/lib/auth";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    fetchUser()
      .then((u) => {
        setUser(u);
        setName(u.name);
        setEmail(u.email);
      })
      .catch(() => {});
  }, []);

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const updated = await updateProfile({ name, email });
      setUser(updated);
      setProfileMsg({ type: "ok", text: "Profile updated successfully." });
    } catch (err) {
      setProfileMsg({
        type: "err",
        text: err instanceof Error ? err.message : "Could not update profile.",
      });
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordMsg(null);
    try {
      await changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMsg({ type: "ok", text: "Password updated successfully." });
    } catch (err) {
      setPasswordMsg({
        type: "err",
        text: err instanceof Error ? err.message : "Could not update password.",
      });
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <AppShell>
      <div className="max-w-xl mx-auto space-y-6">
        <PageHeader
          title="Profile"
          subtitle="Theme preference is saved in this browser via the toggle in the sidebar."
          className="mb-6"
        />

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              {profileMsg && (
                <div
                  className={`rounded-lg border p-3 text-sm ${
                    profileMsg.type === "ok"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
                  }`}
                >
                  {profileMsg.text}
                </div>
              )}
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Email</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" disabled={profileSaving}>
                {profileSaving ? "Saving…" : "Save changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {passwordMsg && (
                <div
                  className={`rounded-lg border p-3 text-sm ${
                    passwordMsg.type === "ok"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
                  }`}
                >
                  {passwordMsg.text}
                </div>
              )}
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Current password</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">New password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Confirm new password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={passwordSaving}>
                {passwordSaving ? "Updating…" : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
