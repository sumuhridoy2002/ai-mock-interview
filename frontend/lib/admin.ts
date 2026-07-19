import { api, apiBlob } from "./api";

export interface AdminUserRow {
  id: number;
  name: string;
  email: string;
  role: "admin" | "candidate";
  interview_count: number;
  completed_count: number;
  average_score: number | null;
  is_profile_public: boolean;
  show_on_leaderboard: boolean;
  public_slug: string | null;
  last_active_at: string | null;
  created_at: string;
}

export interface AdminUsersResponse {
  data: AdminUserRow[];
  current_page: number;
  last_page: number;
  total: number;
}

export interface AdminUserDossier {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    public_slug: string | null;
    public_headline: string | null;
    is_profile_public: boolean;
    show_on_leaderboard: boolean;
    created_at: string;
  };
  stats: {
    interview_count: number;
    completed_count: number;
    average_score: number | null;
    last_active_at: string | null;
  };
  skills: string[];
  interviews: Array<{
    id: number;
    job_title: string;
    status: string;
    interview_type: string;
    experience_level: string;
    created_at: string;
    report?: {
      overall_score: number;
      hiring_recommendation: string;
    };
  }>;
  resumes: Array<{
    id: number;
    original_filename: string;
    status: string;
    mime_type: string;
    created_at: string;
  }>;
  share_links: Array<{
    id: number;
    token: string;
    label: string | null;
    includes_cv: boolean;
    includes_reports: boolean;
    includes_scores: boolean;
    expires_at: string | null;
    revoked_at: string | null;
    view_count: number;
    created_at: string;
  }>;
}

export interface AdminStats {
  total_candidates: number;
  public_profiles: number;
  on_leaderboard: number;
  total_interviews: number;
  completed_interviews: number;
  active_share_links: number;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  return api<AdminStats>("/admin/stats");
}

export async function fetchAdminUsers(search = "", page = 1): Promise<AdminUsersResponse> {
  const params = new URLSearchParams({ page: String(page) });
  if (search) params.set("search", search);
  return api<AdminUsersResponse>(`/admin/users?${params.toString()}`);
}

export async function fetchAdminUser(id: number): Promise<AdminUserDossier> {
  return api<AdminUserDossier>(`/admin/users/${id}`);
}

export async function updateAdminUser(
  id: number,
  payload: Partial<{
    role: string;
    public_slug: string | null;
    public_headline: string | null;
    is_profile_public: boolean;
    show_on_leaderboard: boolean;
  }>
): Promise<void> {
  await api(`/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function createShareLink(
  userId: number,
  payload: {
    label?: string;
    includes_cv?: boolean;
    includes_reports?: boolean;
    includes_scores?: boolean;
    expires_at?: string | null;
  }
): Promise<{ link: { token: string } }> {
  return api(`/admin/users/${userId}/share-links`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function revokeShareLink(linkId: number): Promise<void> {
  await api(`/admin/share-links/${linkId}`, { method: "DELETE" });
}

export async function downloadAdminReportPdf(userId: number, interviewId: number): Promise<Blob> {
  return apiBlob(`/admin/users/${userId}/interviews/${interviewId}/report/pdf`);
}

export async function downloadAdminResume(userId: number, resumeId: number): Promise<Blob> {
  return apiBlob(`/admin/users/${userId}/resumes/${resumeId}/file`);
}
