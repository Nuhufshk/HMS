import { MockApiError } from './http';

/**
 * Thin HTTP client for the HMS backend.
 * All service calls go through here — swap the base URL or add
 * interceptors/refresh logic in this one place when moving to production.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const LS_KEY = 'hms-session';
const SS_KEY = 'hms-session-tab';

/* ----------------------------- Token storage ----------------------------- */

export function getToken(): string | null {
  try {
    const ls = localStorage.getItem(LS_KEY);
    if (ls) return (JSON.parse(ls) as { token?: string }).token ?? null;
    const ss = sessionStorage.getItem(SS_KEY);
    if (ss) return (JSON.parse(ss) as { token?: string }).token ?? null;
  } catch {
    /* ignore */
  }
  return null;
}

export function setToken(token: string, remember: boolean): void {
  const payload = JSON.stringify({ token });
  try {
    if (remember) {
      localStorage.setItem(LS_KEY, payload);
      sessionStorage.removeItem(SS_KEY);
    } else {
      sessionStorage.setItem(SS_KEY, payload);
    }
  } catch {
    /* ignore */
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(LS_KEY);
    sessionStorage.removeItem(SS_KEY);
  } catch {
    /* ignore */
  }
}

/* -------------------------------- Request -------------------------------- */

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { message?: string };
      if (body?.message) message = body.message;
    } catch {
      /* non-JSON error body */
    }
    throw new MockApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const apiClient = {
  get: <T>(path: string) => api<T>(path),
  post: <T>(path: string, body?: unknown) =>
    api<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    api<T>(path, { method: 'PATCH', body: body === undefined ? undefined : JSON.stringify(body) }),
  del: <T>(path: string) => api<T>(path, { method: 'DELETE' }),
};
