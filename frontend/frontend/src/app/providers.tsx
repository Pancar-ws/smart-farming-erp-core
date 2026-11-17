// src/app/providers.tsx
import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/core/api/queryClient';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}

