import { api } from "./api";

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  user: User;
  token: string;
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
  return raw ? JSON.parse(raw) : null;
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

export async function fetchUser(): Promise<User> {
  const data = await api<{ user: User }>("/user");
  setStoredUser(data.user);
  return data.user;
}

export async function updateProfile(payload: { name?: string; email?: string }): Promise<User> {
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
