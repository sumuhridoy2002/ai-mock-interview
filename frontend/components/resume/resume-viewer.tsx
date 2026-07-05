"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, ExternalLink, FileText, Loader2, X } from "lucide-react";
import { apiBlob } from "@/lib/api";
import { Button } from "@/components/ui/button";

export interface ResumeListItem {
  id: number;
  original_filename: string;
  status: string;
  mime_type?: string | null;
  parsed_profile?: { skills?: string[]; summary?: string };
}

interface ResumeViewerProps {
  resume: ResumeListItem | null;
  onClose: () => void;
}

function isPdf(resume: ResumeListItem): boolean {
  const name = resume.original_filename.toLowerCase();
  return name.endsWith(".pdf") || resume.mime_type === "application/pdf";
}

export function ResumeViewer({ resume, onClose }: ResumeViewerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFile = useCallback(async () => {
    if (!resume) return;

    setLoading(true);
    setError(null);
    setBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    try {
      const blob = await apiBlob(`/resumes/${resume.id}/file`);
      setBlobUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load resume file.");
    } finally {
      setLoading(false);
    }
  }, [resume]);

  useEffect(() => {
    if (!resume) {
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setError(null);
      return;
    }

    void loadFile();
  }, [resume, loadFile]);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  if (!resume) return null;

  const pdf = isPdf(resume);

  function handleDownload() {
    if (!blobUrl) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = resume!.original_filename;
    a.click();
  }

  function handleOpenTab() {
    if (!blobUrl) return;
    window.open(blobUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-viewer-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <h2 id="resume-viewer-title" className="truncate text-sm font-semibold text-foreground">
                {resume.original_filename}
              </h2>
              <p className="text-xs text-muted-foreground">
                {pdf ? "PDF preview" : "Word document — download to open locally"}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {blobUrl && (
              <>
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleOpenTab}>
                  <ExternalLink className="h-4 w-4" />
                  Open
                </Button>
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-muted/30">
          {loading && (
            <div className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading resume…
            </div>
          )}

          {error && !loading && (
            <div className="p-6 text-center text-sm text-red-600 dark:text-red-400">{error}</div>
          )}

          {!loading && !error && blobUrl && pdf && (
            <iframe
              src={blobUrl}
              title={resume.original_filename}
              className="h-[min(70vh,720px)] w-full border-0 bg-white"
            />
          )}

          {!loading && !error && blobUrl && !pdf && (
            <div className="space-y-4 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                This file type cannot be previewed in the browser. Use Download or Open to view it in Word or another app.
              </p>
              {resume.parsed_profile?.skills && (
                <div className="rounded-xl border border-border bg-card p-4 text-left">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Parsed skills</p>
                  <p className="text-sm text-foreground">{resume.parsed_profile.skills.join(", ")}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
