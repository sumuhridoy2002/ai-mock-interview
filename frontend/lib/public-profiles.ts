import { publicApi } from "./api";

export interface LeaderboardEntry {
  rank: number;
  name: string;
  slug: string;
  headline: string | null;
  average_score: number;
  completed_count: number;
}

export interface PublicProfile {
  name: string;
  slug: string;
  headline: string | null;
  average_score: number | null;
  completed_count: number;
  skills: string[];
}

export interface ShareDossier {
  label: string | null;
  candidate: { name: string; headline: string | null };
  includes_cv: boolean;
  includes_reports: boolean;
  includes_scores: boolean;
  scores?: { average_score: number | null; completed_count: number };
  skills?: string[];
  interviews?: Array<{
    id: number;
    job_title: string;
    interview_type: string;
    created_at: string;
    overall_score?: number;
    hiring_recommendation?: string;
    strengths?: string[];
    weaknesses?: string[];
  }>;
  resumes?: Array<{
    id: number;
    original_filename: string;
    mime_type: string;
    created_at: string;
  }>;
}

export async function fetchLeaderboard(limit = 100): Promise<LeaderboardEntry[]> {
  const data = await publicApi<{ data: LeaderboardEntry[] }>(`/public/leaderboard?limit=${limit}`);
  return data.data ?? [];
}

export async function fetchPublicProfile(slug: string): Promise<PublicProfile> {
  const data = await publicApi<{ profile: PublicProfile }>(`/public/profiles/${slug}`);
  return data.profile;
}

export async function fetchShareDossier(token: string): Promise<ShareDossier> {
  const data = await publicApi<{ share: ShareDossier }>(`/public/share/${token}`);
  return data.share;
}

export function publicResumeFileUrl(token: string, resumeId: number): string {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  return `${base}/public/share/${token}/resumes/${resumeId}/file`;
}
