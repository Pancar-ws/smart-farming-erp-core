// src/core/api/client.ts
import { useSession } from '@/core/auth/session';
import { ApiError, toApiError } from './errors';

export interface AppConfig {
  apiBaseUrl: string;
  orgName: string;
  thermalWidthMm: number;
  idleLogoutMinutes: number;
  env?: string;
}

declare global {
  interface Window {
    __CONFIG__: AppConfig;
  }
}

const base = () => window.__CONFIG__?.apiBaseUrl || '/api/v1';
let refreshing: Promise<boolean> | null = null;

export async function refreshAccessToken(): Promise<boolean> {
  const { refreshToken, setAccessToken } = useSession.getState();
  if (!refreshToken) return false;
  try {
    const r = await fetch(`${base()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!r.ok) return false;
    const data = await r.json();
    setAccessToken(data.access_token);
    return true;
  } catch {
    return false;
  }
}

type Init = Omit<RequestInit, 'body'> & {
  query?: Record<string, unknown>;
  json?: unknown;
  body?: BodyInit;
};

export async function api<T = unknown>(path: string, init: Init = {}): Promise<T> {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrlStr = base();
  const url = new URL(baseUrlStr + cleanPath, window.location.origin);

  for (const [k, v] of Object.entries(init.query ?? {})) {
    if (v !== undefined && v !== '' && v !== null) {
      url.searchParams.set(k, String(v));
    }
  }

  const send = () => {
    const token = useSession.getState().accessToken;
    return fetch(url, {
      ...init,
      headers: {
        ...(init.json !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
      body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
    });
  };

  let res: Response;
  try {
    res = await send();
  } catch {
    throw new ApiError(0, 'NETWORK', 'Tidak dapat menghubungi server. Periksa koneksi internet.');
  }

  if (res.status === 401 && !path.startsWith('/auth/login')) {
    refreshing ??= refreshAccessToken().finally(() => {
      refreshing = null;
    });
    if (await refreshing) {
      res = await send();
    } else {
      useSession.getState().clear();
      throw new ApiError(401, 'UNAUTHORIZED', 'Sesi berakhir. Silakan masuk kembali.');
    }
  }

  if (!res.ok) {
    throw await toApiError(res);
  }

  return (res.status === 204 ? undefined : await res.json()) as T;
}

