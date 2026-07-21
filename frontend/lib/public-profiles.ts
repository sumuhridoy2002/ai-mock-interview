import { publicApi } from "./api";
import { API_URL } from "./api-url";

export interface LeaderboardEntry {
  rank: number;
  name: string;
  slug: string;
  headline: string | null;
  average_score: number;
  completed_count: number;
}

export interface PublicCv {
  filename: string;
  updated_at: string;
  summary: string | null;
  experience_years: number;
  skills: string[];
  education: string[];
  projects: string[];
}

export interface PublicInterview {
  id: number;
  job_title: string;
  interview_type: string;
  experience_level: string;
  created_at: string;
  overall_score?: number;
  hiring_recommendation?: string;
  category_scores?: Record<string, number>;
  strengths?: string[];
  weaknesses?: string[];
}

export interface PublicPerformance {
  best_score: number | null;
  by_type: Record<
    string,
    { count: number; average_score: number | null }
  >;
  top_strengths: string[];
  improvement_areas: string[];
}

export interface PublicProfile {
  name: string;
  slug: string;
  headline: string | null;
  member_since: string;
  average_score: number | null;
  completed_count: number;
  interview_count: number;
  last_active_at: string | null;
  skills: string[];
  cv: PublicCv | null;
  interviews: PublicInterview[];
  performance: PublicPerformance;
}

export interface ShareDossier {
  label: string | null;
  candidate: { name: string; headline: string | null };
  includes_cv: boolean;
  includes_reports: boolean;
  includes_scores: boolean;
  scores?: { average_score: number | null; completed_count: number };
  skills?: string[];
  interviews?: PublicInterview[];
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
  return `${API_URL}/public/share/${token}/resumes/${resumeId}/file`;
}
