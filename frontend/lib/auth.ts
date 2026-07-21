import { api, resolveApiUrl } from "./api";

export const USER_ETAG_STORAGE_KEY = "mip_user_etag";

export type UserRole = "admin" | "candidate";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  public_slug?: string | null;
  is_profile_public?: boolean;
  show_on_leaderboard?: boolean;
  public_headline?: string | null;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export function isAdmin(user: User | null | undefined): boolean {
  return user?.role === "admin";
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

export function setToken(token: string): void {
  localStorage.setItem("auth_token", token);
}

export function clearToken(): void {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("auth_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  localStorage.setItem("auth_user", JSON.stringify(user));
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const data = await api<AuthResponse>("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  setStoredUser(data.user);
  return data;
}

export async function register(
  name: string,
  email: string,
  password: string,
  password_confirmation: string
): Promise<AuthResponse> {
  const data = await api<AuthResponse>("/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, password_confirmation }),
  });
  setToken(data.token);
  setStoredUser(data.user);
  return data;
}

export async function logout(): Promise<void> {
  try {
    await api("/logout", { method: "POST" });
  } finally {
    clearToken();
  }
}

let inflightFetchUser: Promise<User> | null = null;

async function fetchUserFromApi(): Promise<User> {
  const token = getToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const lastEtag =
    typeof sessionStorage !== "undefined"
      ? (sessionStorage.getItem(USER_ETAG_STORAGE_KEY) ?? undefined)
      : undefined;

  const response = await fetch(`${resolveApiUrl()}/user`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(lastEtag ? { "If-None-Match": lastEtag } : {}),
    },
    cache: "no-store",
  });

  const newEtag = response.headers.get("ETag");
  if (newEtag && typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(USER_ETAG_STORAGE_KEY, newEtag);
  }

  if (response.status === 304) {
    const stored = getStoredUser();
    if (stored) {
      return stored;
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = (data as { message?: string }).message || "Request failed";
    throw new Error(message);
  }

  const user = (data as { user: User }).user;
  setStoredUser(user);
  return user;
}

export async function fetchUser(): Promise<User> {
  if (inflightFetchUser) {
    return inflightFetchUser;
  }

  inflightFetchUser = fetchUserFromApi().finally(() => {
    inflightFetchUser = null;
  });

  return inflightFetchUser;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  public_headline?: string | null;
  is_profile_public?: boolean;
  show_on_leaderboard?: boolean;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  const data = await api<{ user: User }>("/user", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  setStoredUser(data.user);
  return data.user;
}

export async function changePassword(payload: {
  current_password: string;
  password: string;
  password_confirmation: string;
}): Promise<void> {
  await api("/user/password", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
