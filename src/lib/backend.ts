import 'server-only';

import { cookies } from 'next/headers';

type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

function backendBaseUrl() {
  const raw = process.env.BACKEND_BASE_URL || 'http://localhost:8080';
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

export async function backendFetch<T>(
  path: string,
  init?: RequestInit & { skipAuth?: boolean },
): Promise<T> {
  const url = `${backendBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (!init?.skipAuth) {
    const token = cookies().get('backend_token')?.value;
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...init,
    headers,
    cache: 'no-store',
  });

  const contentType = res.headers.get('content-type') || '';
  const text = await res.text().catch(() => '');

  const parsed = (() => {
    if (!text) return null;
    const isJson =
      contentType.includes('application/json') ||
      contentType.includes('application/problem+json') ||
      (text.startsWith('{') && text.endsWith('}')) ||
      (text.startsWith('[') && text.endsWith(']'));
    if (!isJson) return null;
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return null;
    }
  })();

  const wrapped = (() => {
    if (!parsed || typeof parsed !== 'object') return null;
    if (!('ok' in parsed)) return null;
    return parsed as ApiResponse<T>;
  })();

  if (res.ok) {
    if (wrapped && wrapped.ok === true) return wrapped.data;
    if (wrapped && wrapped.ok === false) {
      throw new Error(wrapped.error?.message || 'Request failed');
    }
    if (parsed != null) return parsed as T;
    return undefined as T;
  }

  const message = (() => {
    if (wrapped && wrapped.ok === false && wrapped.error?.message) {
      return wrapped.error.message;
    }
    if (parsed && typeof parsed === 'object') {
      const anyParsed = parsed as Record<string, unknown>;
      const m = anyParsed.message;
      if (typeof m === 'string' && m.trim()) return m;
      const e = anyParsed.error;
      if (typeof e === 'string' && e.trim()) return e;
      const detail = anyParsed.detail;
      if (typeof detail === 'string' && detail.trim()) return detail;
    }
    if (text && text.trim()) {
      const snippet = text.trim().slice(0, 300);
      return `Request failed (${res.status}): ${snippet}`;
    }
    return `Request failed (${res.status})`;
  })();

  throw new Error(message);
}
