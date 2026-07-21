import { API_URL } from "./api-url";

export { API_URL, BACKEND_ORIGIN, resolveApiUrl, resolveBackendOrigin } from "./api-url";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
  }
}

const NETWORK_ERROR =
  "Cannot reach the API. Ensure Laravel is running (php artisan serve) and restart the frontend (npm run dev).";

async function fetchApi(path: string, options: RequestInit = {}): Promise<Response> {
  try {
    return await fetch(`${API_URL}${path}`, options);
  } catch {
    throw new ApiError(NETWORK_ERROR, 0);
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  const headers: HeadersInit = {
    Accept: "application/json",
    ...(options.body instanceof FormData
      ? {}
      : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetchApi(path, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      (data as { message?: string }).message || "Request failed",
      response.status,
      data
    );
  }

  return data as T;
}

/** Public API calls without auth token. */
export async function publicApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    Accept: "application/json",
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...options.headers,
  };

  const response = await fetchApi(path, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      (data as { message?: string }).message || "Request failed",
      response.status,
      data
    );
  }

  return data as T;
}

/** Fetch a binary file from the API with the stored auth token. */
export async function apiBlob(path: string): Promise<Blob> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  const response = await fetchApi(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(
      (data as { message?: string }).message || "Request failed",
      response.status,
      data,
    );
  }

  return response.blob();
}
