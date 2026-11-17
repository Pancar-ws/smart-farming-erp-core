// src/core/auth/guards.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSession, can } from './session';
import { refreshAccessToken } from '@/core/api/client';

export async function bootstrapSession() {
  const { refreshToken, accessToken, clear } = useSession.getState();
  if (refreshToken && !accessToken) {
    try {
      const ok = await refreshAccessToken();
      if (!ok) clear();
    } catch {
      clear();
    }
  }
}

export function RequireAuth() {
  const { user } = useSession();
  const loc = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ returnTo: loc.pathname + loc.search }} />;
  }

  return <Outlet />;
}

export function RequirePermission({ any }: { any: string[] }) {
  const { user } = useSession();

  if (!can(user, ...any)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}

