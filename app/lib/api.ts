/**
 * Centralized API client for communicating with the NestJS backend.
 * 
 * In production (cPanel deployment):
 *   NEXT_PUBLIC_API_URL=https://api.yehagere.com/api/v1
 * In local development:
 *   NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "/api";

export const NESTJS_API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  (typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? `${window.location.protocol}//api.${window.location.hostname.replace(/^www\./, "")}/api/v1`
    : "http://localhost:3001/api/v1");

interface RequestOptions extends RequestInit {
  token?: string;
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<{ data: T; error?: never } | { data?: never; error: string; status?: number }> {
  const { token, params, headers, ...customConfig } = options;

  let url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

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
    const response = await fetch(url, {
      credentials: "include",
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
