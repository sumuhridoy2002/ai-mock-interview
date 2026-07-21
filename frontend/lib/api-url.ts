/** Resolve Laravel API base URL for browser vs Next.js server. */

const SERVER_FALLBACK = "http://127.0.0.1:8000";

export function resolveBackendOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, "");
  if (fromEnv) return fromEnv;

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return SERVER_FALLBACK;
}

export function resolveApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== "undefined") {
    // Proxied through Next.js rewrites — same origin, no CORS issues.
    return "/api/v1";
  }

  return `${SERVER_FALLBACK}/api/v1`;
}

export const API_URL = resolveApiUrl();

export const BACKEND_ORIGIN = resolveBackendOrigin();
