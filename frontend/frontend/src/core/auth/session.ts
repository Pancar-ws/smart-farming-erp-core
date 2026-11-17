// src/core/auth/session.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: number;
  name: string;
  role: string;
  permissions: string[];
}

interface SessionState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  setSession(s: { accessToken: string; refreshToken: string; user: User }): void;
  setAccessToken(t: string): void;
  clear(): void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setSession: (s) => set(s),
      setAccessToken: (accessToken) => set({ accessToken }),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: 'erp-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ refreshToken: s.refreshToken, user: s.user }),
    }
  )
);

export const can = (user: User | null, ...perms: string[]): boolean => {
  if (!user) return false;
  if (user.permissions.includes('*')) return true;
  if (perms.length === 0) return true;
  return perms.some((p) => user.permissions.includes(p));
};

