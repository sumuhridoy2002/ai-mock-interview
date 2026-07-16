"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Upload, FileText, CheckCircle, Loader2, AlertCircle, Eye, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHero, SectionPanel } from "@/components/ui/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { ResumeListItem, ResumeViewer } from "@/components/resume/resume-viewer";

export default function ResumeUploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [viewingResume, setViewingResume] = useState<ResumeListItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadResumes = useCallback(async () => {
    const res = await api<{ data: ResumeListItem[] }>("/resumes");
    setResumes(res.data);
  }, []);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  useEffect(() => {
    const hasPending = resumes.some((r) => r.status === "pending");
    if (!hasPending) return;

    const id = window.setInterval(loadResumes, 3000);
    return () => window.clearInterval(id);
  }, [resumes, loadResumes]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function uploadFile(file: File) {
    setUploading(true);
    setDeleteError(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await api<{ replaced?: boolean }>("/resumes", { method: "POST", body: form });
      await loadResumes();
      if (res.replaced) {
        setToast("Replaced existing file — parsing again.");
      } else {
        setToast("Resume uploaded.");
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(e: React.MouseEvent, resume: ResumeListItem) {
    e.stopPropagation();
    if (!window.confirm(`Delete "${resume.original_filename}"?`)) return;

    setDeletingId(resume.id);
    setDeleteError(null);
    try {
      await api(`/resumes/${resume.id}`, { method: "DELETE" });
      if (viewingResume?.id === resume.id) setViewingResume(null);
      await loadResumes();
      setToast("Resume deleted.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const body = err.data as { blocking_interview_ids?: number[]; message?: string };
        const ids = body.blocking_interview_ids?.join(", ") ?? "";
        setDeleteError(
          ids
            ? `Used by interview #${ids} — complete or cancel first.`
            : (body.message ?? "Cannot delete this resume."),
        );
      } else {
        setDeleteError("Could not delete resume.");
      }
    } finally {
      setDeletingId(null);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHero
          icon={Upload}
          title="Upload Resume"
          subtitle="PDF or DOCX — max 5MB. Parsed skills feed your interview questions."
          accent="blue"
        />

        {toast && (
          <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            {toast}
          </p>
        )}
        {deleteError && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-700 dark:text-red-300">
            {deleteError}
          </p>
        )}

        <Card
          className={`border-dashed border-2 transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border"}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <CardContent className="py-12 text-center">
            <Upload className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
            <p className="text-slate-900 dark:text-white font-semibold mb-2">Drag & drop your resume here</p>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 font-medium">or click to browse</p>
            <Button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                </span>
              ) : (
                "Choose file"
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadFile(file);
                e.target.value = "";
              }}
            />
          </CardContent>
        </Card>

        <SectionPanel title="Your Resumes" description="Click a resume to view it. Parsed resumes are available in Interview Setup.">
          <div className="space-y-3">
            {resumes.length === 0 ? (
              <p className="text-muted-foreground text-sm font-medium">No resumes uploaded yet.</p>
            ) : (
              resumes.map((r) => (
                <div
                  key={r.id}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-muted/40 p-3 shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/70"
                >
                  <button
                    type="button"
                    onClick={() => setViewingResume(r)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <FileText className="h-5 w-5 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{r.original_filename}</p>
                      {r.parsed_profile?.skills && (
                        <p className="truncate text-xs text-muted-foreground">{r.parsed_profile.skills.slice(0, 5).join(", ")}</p>
                      )}
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
                      <Eye className="h-4 w-4" />
                      View
                    </span>
                  </button>
                  {r.status === "parsed" ? (
                    <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : r.status === "pending" ? (
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin text-amber-600 dark:text-amber-400" />
                  ) : r.status === "failed" ? (
                    <span title="Parsing failed — re-upload to retry">
                      <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                    </span>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-red-600"
                    disabled={deletingId === r.id}
                    onClick={(e) => handleDelete(e, r)}
                    title="Delete resume"
                  >
                    {deletingId === r.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
        </SectionPanel>

        <ResumeViewer resume={viewingResume} onClose={() => setViewingResume(null)} />
      </div>
    </AppShell>
  );
}
