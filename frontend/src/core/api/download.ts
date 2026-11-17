// src/core/api/download.ts
import { useSession } from '@/core/auth/session';
import { toApiError } from './errors';

export async function downloadReport(
  path: string,
  query: Record<string, unknown>,
  format: 'xlsx' | 'pdf',
  filename: string
) {
  const base = window.__CONFIG__?.apiBaseUrl || '/api/v1';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(base + cleanPath, window.location.origin);

  url.searchParams.set('format', format);
  Object.entries(query).forEach(([k, v]) => {
    if (v !== null && v !== undefined && String(v).trim() !== '') {
      url.searchParams.set(k, String(v));
    }
  });

  const token = useSession.getState().accessToken;
  const res = await fetch(url, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    throw await toApiError(res);
  }

  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${filename.replace(/[^\w.-]+/g, '_')}.${format}`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
}

