/** Resolve Laravel API base URL for browser vs Next.js server. */

/** Use 127.0.0.1 — php artisan serve binds IPv4 only; Node resolves localhost to ::1. */
export const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

export function resolveApiUrl(): string {
  if (typeof window !== "undefined") {
    // Same-origin proxy (next.config rewrites) — avoids CORS and IPv6 localhost issues.
    return "/api/v1";
  }

  return process.env.NEXT_PUBLIC_API_URL || `${BACKEND_ORIGIN}/api/v1`;
}

export function resolveBackendOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return BACKEND_ORIGIN;
}

/** @deprecated Prefer resolveApiUrl() so the URL is resolved at request time. */
export const API_URL = resolveApiUrl();
