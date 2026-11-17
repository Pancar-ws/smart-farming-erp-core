// src/core/auth/Can.tsx
import React from 'react';
import { useSession, can } from './session';

export function Can({
  perm,
  children,
  fallback = null,
}: {
  perm: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { user } = useSession();
  const allowed = can(user, ...(Array.isArray(perm) ? perm : [perm]));
  return allowed ? <>{children}</> : <>{fallback}</>;
}

