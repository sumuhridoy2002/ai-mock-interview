"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { PageHero, SectionPanel } from "@/components/ui/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User as UserIcon, ExternalLink } from "lucide-react";
import { changePassword, fetchUser, getStoredUser, isAdmin, updateProfile, User } from "@/lib/auth";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [publicHeadline, setPublicHeadline] = useState(user?.public_headline ?? "");
  const [isProfilePublic, setIsProfilePublic] = useState(user?.is_profile_public ?? false);
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(user?.show_on_leaderboard ?? false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [visibilitySaving, setVisibilitySaving] = useState(false);

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
        setPublicHeadline(u.public_headline ?? "");
        setIsProfilePublic(u.is_profile_public ?? false);
        setShowOnLeaderboard(u.show_on_leaderboard ?? false);
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

  async function handleVisibilitySave(payload: {
    is_profile_public?: boolean;
    show_on_leaderboard?: boolean;
    public_headline?: string | null;
  }) {
    setVisibilitySaving(true);
    setProfileMsg(null);
    try {
      const updated = await updateProfile(payload);
      setUser(updated);
      setIsProfilePublic(updated.is_profile_public ?? false);
      setShowOnLeaderboard(updated.show_on_leaderboard ?? false);
      setPublicHeadline(updated.public_headline ?? "");
      setProfileMsg({ type: "ok", text: "Visibility settings updated." });
    } catch (err) {
      setProfileMsg({
        type: "err",
        text: err instanceof Error ? err.message : "Could not update visibility.",
      });
    } finally {
      setVisibilitySaving(false);
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
    <div className="max-w-5xl mx-auto space-y-6">
        <PageHero
          icon={UserIcon}
          title="Profile"
          subtitle={
            isAdmin(user)
              ? "Update your admin account name, email, and password."
              : "Update your account, password, and public visibility preferences."
          }
          accent="violet"
        />

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <SectionPanel title="Account Information">
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
          </SectionPanel>

          <SectionPanel title="Change Password">
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
          </SectionPanel>
        </div>

        {!isAdmin(user) && (
        <SectionPanel title="Public visibility">
          <div className="space-y-4 max-w-lg">
            <p className="text-sm text-muted-foreground">
              Opt in to share your performance publicly or with recruiters via admin-generated links.
              Your email is never shown on public pages.
            </p>
            <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
              <span className="text-sm">Show my profile publicly</span>
              <input
                type="checkbox"
                checked={isProfilePublic}
                disabled={visibilitySaving}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsProfilePublic(checked);
                  if (!checked) setShowOnLeaderboard(false);
                  handleVisibilitySave({
                    is_profile_public: checked,
                    show_on_leaderboard: checked ? showOnLeaderboard : false,
                  });
                }}
              />
            </label>
            <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
              <span className="text-sm">Include me in the top 100 leaderboard</span>
              <input
                type="checkbox"
                checked={showOnLeaderboard}
                disabled={visibilitySaving || !isProfilePublic}
                onChange={(e) => {
                  setShowOnLeaderboard(e.target.checked);
                  handleVisibilitySave({ show_on_leaderboard: e.target.checked });
                }}
              />
            </label>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Public headline</label>
              <Input
                value={publicHeadline}
                onChange={(e) => setPublicHeadline(e.target.value)}
                placeholder="e.g. Senior Laravel Developer"
                disabled={!isProfilePublic || visibilitySaving}
                onBlur={() =>
                  isProfilePublic &&
                  handleVisibilitySave({ public_headline: publicHeadline || null })
                }
              />
            </div>
            {user?.public_slug && isProfilePublic && (
              <Link
                href={`/public/profiles/${user.public_slug}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Preview public profile <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </SectionPanel>
        )}
      </div>
  );
}
