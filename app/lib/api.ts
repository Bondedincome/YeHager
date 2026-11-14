/**
 * Centralized API client for communicating with the NestJS backend.
 *
 * The backend serves everything under /api/v1.
 * In production (cPanel deployment):
 *   NEXT_PUBLIC_API_URL=https://api.yehagere.com/api/v1
 * In local development (backend on port 3000, Next.js dev server on 3001):
 *   NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
 */

const API_PREFIX = "/api/v1";
const LOCAL_BACKEND_PORT = "3000";

/** Accept "https://api.example.com" as well as ".../api/v1" — add the prefix if missing. */
function withApiPrefix(base: string): string {
  const trimmed = base.replace(/\/+$/, "");
  try {
    const url = new URL(trimmed);
    if (url.pathname === "" || url.pathname === "/") return `${trimmed}${API_PREFIX}`;
  } catch {
    // relative or unusual value: use as given
  }
  return trimmed;
}

function resolveNestApiBase(): string {
  const configuredBase = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configuredBase) return withApiPrefix(configuredBase);

  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;
    const apiHost = hostname === "localhost" || hostname === "127.0.0.1"
      ? `${hostname}:${LOCAL_BACKEND_PORT}`
      : `api.${hostname.replace(/^www\./, "")}`;
    return `${protocol}//${apiHost}${API_PREFIX}`;
  }

  return `http://localhost:${LOCAL_BACKEND_PORT}${API_PREFIX}`;
}

export const NESTJS_API_BASE = resolveNestApiBase();
export const API_BASE_URL = NESTJS_API_BASE;

export function apiUrl(endpoint: string): string {
  if (/^https?:\/\//i.test(endpoint)) return endpoint;
  return `${API_BASE_URL}/${endpoint.replace(/^\/+/, "")}`;
}

export function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (typeof window !== "undefined" && !headers.has("Authorization")) {
    const token = localStorage.getItem("yehagere_auth_token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(apiUrl(endpoint), {
    ...options,
    credentials: options.credentials ?? "include",
    headers,
  });
}

interface RequestOptions extends RequestInit {
  token?: string;
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<{ data: T; error?: never } | { data?: never; error: string; status?: number }> {
  const { token, params, headers, ...customConfig } = options;

  let url = apiUrl(endpoint);

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const storedToken =
    token ||
    (typeof window !== "undefined"
      ? localStorage.getItem("yehagere_auth_token") || undefined
      : undefined);

  if (storedToken) {
    defaultHeaders["Authorization"] = `Bearer ${storedToken}`;
  }

  try {
    const response = await apiFetch(url, {
      headers: {
        ...defaultHeaders,
        ...headers,
      },
      ...customConfig,
    });

    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMsg =
        typeof payload === "object" && payload && "message" in payload
          ? Array.isArray(payload.message)
            ? payload.message[0]
            : payload.message
          : typeof payload === "object" && payload && "error" in payload
            ? payload.error
            : `Request failed with status ${response.status}`;
      return { error: String(errorMsg), status: response.status };
    }

    // Handle NestJS TransformInterceptor response format { success: true, data: ... }
    const unwrapped =
      typeof payload === "object" && payload && "data" in payload && "success" in payload
        ? payload.data
        : payload;

    return { data: unwrapped as T };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network request failed";
    return { error: message };
  }
}
