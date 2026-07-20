"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  Link2,
  Mic,
  Share2,
  User as UserIcon,
} from "lucide-react";
import { PageHero, SectionPanel, StatTile } from "@/components/ui/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  createShareLink,
  downloadAdminReportPdf,
  downloadAdminResume,
  fetchAdminUser,
  revokeShareLink,
  updateAdminUser,
  type AdminUserDossier,
} from "@/lib/admin";
import { formatScore } from "@/lib/utils";

type Tab = "overview" | "interviews" | "resumes" | "sharing";

export default function AdminUserDetailPage() {
  const params = useParams();
  const userId = Number(params.id);
  const [dossier, setDossier] = useState<AdminUserDossier | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shareLabel, setShareLabel] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminUser(userId);
      setDossier(data);
    } catch {
      setDossier(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleToggle(field: "is_profile_public" | "show_on_leaderboard", value: boolean) {
    if (!dossier) return;
    setSaving(true);
    setMsg(null);
    try {
      await updateAdminUser(userId, { [field]: value });
      await load();
      setMsg("Settings updated.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleHeadlineSave(headline: string) {
    setSaving(true);
    try {
      await updateAdminUser(userId, { public_headline: headline || null });
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateShareLink() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await createShareLink(userId, { label: shareLabel || undefined });
      setShareLabel("");
      await load();
      const url = `${window.location.origin}/share/${res.link.token}`;
      setMsg(`Share link created: ${url}`);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not create link.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRevokeLink(linkId: number) {
    setSaving(true);
    try {
      await revokeShareLink(linkId);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDownloadPdf(interviewId: number) {
    const blob = await downloadAdminReportPdf(userId, interviewId);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-report-${interviewId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function openResume(resumeId: number) {
    const blob = await downloadAdminResume(userId, resumeId);
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading user profile…</p>;
  }

  if (!dossier) {
    return <p className="text-muted-foreground">User not found.</p>;
  }

  const { user, stats, skills, interviews, resumes, share_links } = dossier;
  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "interviews", label: "Interviews" },
    { id: "resumes", label: "Resumes" },
    { id: "sharing", label: "Sharing" },
  ];

  return (
    <div className="space-y-6">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to users
        </Link>

        <PageHero
          icon={UserIcon}
          title={user.name}
          subtitle={user.email}
          accent="indigo"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatTile icon={Mic} label="Interviews" value={stats.interview_count} accent="indigo" />
          <StatTile icon={FileText} label="Completed" value={stats.completed_count} accent="emerald" />
          <StatTile
            icon={Share2}
            label="Average score"
            value={stats.average_score != null ? formatScore(stats.average_score) : "—"}
            accent="amber"
          />
        </div>

        <div className="flex flex-wrap gap-2 border-b border-border pb-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {msg && (
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">{msg}</div>
        )}

        {tab === "overview" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <SectionPanel title="Profile settings">
              <div className="space-y-4">
                <label className="flex items-center justify-between gap-4">
                  <span className="text-sm">Public profile</span>
                  <input
                    type="checkbox"
                    checked={user.is_profile_public}
                    disabled={saving}
                    onChange={(e) => handleToggle("is_profile_public", e.target.checked)}
                  />
                </label>
                <label className="flex items-center justify-between gap-4">
                  <span className="text-sm">Show on leaderboard</span>
                  <input
                    type="checkbox"
                    checked={user.show_on_leaderboard}
                    disabled={saving || !user.is_profile_public}
                    onChange={(e) => handleToggle("show_on_leaderboard", e.target.checked)}
                  />
                </label>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Public headline</label>
                  <Input
                    defaultValue={user.public_headline ?? ""}
                    onBlur={(e) => handleHeadlineSave(e.target.value)}
                  />
                </div>
                {user.public_slug && user.is_profile_public && (
                  <Link
                    href={`/public/profiles/${user.public_slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    View public profile <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </SectionPanel>

            <SectionPanel title="Skills">
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-muted px-3 py-1 text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No parsed skills yet.</p>
              )}
            </SectionPanel>
          </div>
        )}

        {tab === "interviews" && (
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {interviews.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No interviews yet.</p>
              ) : (
                interviews.map((interview) => (
                  <div
                    key={interview.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-4"
                  >
                    <div>
                      <p className="font-medium">{interview.job_title}</p>
                      <p className="text-sm text-muted-foreground">
                        {interview.interview_type} · {interview.status}
                        {interview.report?.overall_score != null &&
                          ` · ${formatScore(interview.report.overall_score)}`}
                      </p>
                    </div>
                    {interview.status === "completed" && interview.report && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadPdf(interview.id)}
                      >
                        <Download className="h-4 w-4 mr-1" /> PDF
                      </Button>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {tab === "resumes" && (
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {resumes.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No resumes uploaded.</p>
              ) : (
                resumes.map((resume) => (
                  <div
                    key={resume.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-4"
                  >
                    <div>
                      <p className="font-medium">{resume.original_filename}</p>
                      <p className="text-sm text-muted-foreground">{resume.status}</p>
                    </div>
                    {resume.status === "parsed" && (
                      <Button size="sm" variant="outline" onClick={() => openResume(resume.id)}>
                        <ExternalLink className="h-4 w-4 mr-1" /> View CV
                      </Button>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {tab === "sharing" && (
          <div className="space-y-6">
            <SectionPanel title="Create share link">
              <div className="flex flex-wrap gap-2">
                <Input
                  value={shareLabel}
                  onChange={(e) => setShareLabel(e.target.value)}
                  placeholder="Label (optional)"
                  className="max-w-xs"
                />
                <Button onClick={handleCreateShareLink} disabled={saving}>
                  <Link2 className="h-4 w-4 mr-1" /> Create link
                </Button>
              </div>
            </SectionPanel>

            <Card>
              <CardContent className="p-0 divide-y divide-border">
                {share_links.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">No share links yet.</p>
                ) : (
                  share_links.map((link) => {
                    const active = !link.revoked_at;
                    const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/share/${link.token}`;
                    return (
                      <div key={link.id} className="p-4 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-medium">{link.label || "Untitled link"}</p>
                            <p className="text-xs text-muted-foreground break-all">{shareUrl}</p>
                            <p className="text-xs text-muted-foreground">
                              Views: {link.view_count}
                              {link.revoked_at ? " · Revoked" : " · Active"}
                            </p>
                          </div>
                          {active && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRevokeLink(link.id)}
                              disabled={saving}
                            >
                              Revoke
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
  );
}
