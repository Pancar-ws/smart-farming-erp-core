// src/core/api/queryClient.ts
import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './errors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (n, e) => {
        if (e instanceof ApiError) {
          return e.isRetryable && n < 2;
        }
        return n < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

