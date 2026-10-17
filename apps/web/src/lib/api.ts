const API_URL = (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL || "";
const BASE = (API_URL ? API_URL.replace(/\/$/, "") : "") + "/api/v1";

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(options.headers as Record<string, string>) };
  // csrf token from cookie
  const csrf = document.cookie.match(/(?:^|; )csrf=([^;]+)/)?.[1];
  if (csrf && options.method && !["GET", "HEAD"].includes(options.method)) {
    headers["X-CSRF-Token"] = decodeURIComponent(csrf);
  }
  const res = await fetch(BASE + path, { ...options, headers, credentials: "include" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (json as { error?: { message?: string } })?.error?.message || res.statusText;
    throw new Error(msg);
  }
  return json as T;
}

export const apiGet = <T>(path: string) => api<T>(path);
export const apiPost = <T>(path: string, body?: unknown) => api<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
export const apiPatch = <T>(path: string, body?: unknown) => api<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined });
export const apiDelete = <T>(path: string) => api<T>(path, { method: "DELETE" });
