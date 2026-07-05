"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Upload, FileText, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface Resume {
  id: number;
  original_filename: string;
  status: string;
  parsed_profile?: { skills?: string[] };
}

export default function ResumeUploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const loadResumes = useCallback(async () => {
    const res = await api<{ data: Resume[] }>("/resumes");
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

  async function uploadFile(file: File) {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      await api("/resumes", { method: "POST", body: form });
      await loadResumes();
    } finally {
      setUploading(false);
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
        <PageHeader
          title="Upload Resume"
          subtitle="PDF or DOCX — max 5MB"
        />

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

        <Card>
          <CardHeader>
            <CardTitle>Your Resumes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {resumes.length === 0 ? (
              <p className="text-muted-foreground text-sm font-medium">No resumes uploaded yet.</p>
            ) : (
              resumes.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                  <FileText className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-foreground text-sm font-medium">{r.original_filename}</p>
                    {r.parsed_profile?.skills && (
                      <p className="text-xs text-slate-400">{r.parsed_profile.skills.slice(0, 5).join(", ")}</p>
                    )}
                  </div>
                  {r.status === "parsed" ? (
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                  ) : r.status === "pending" ? (
                    <Loader2 className="h-5 w-5 text-amber-400 animate-spin" />
                  ) : r.status === "failed" ? (
                    <span title="Parsing failed — re-upload to retry">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    </span>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
