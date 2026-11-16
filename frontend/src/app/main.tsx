// src/app/main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { Providers } from './providers';
import { bootstrapSession } from '@/core/auth/guards';
import { startOutboxSync } from '@/core/offline/outbox';

import '@/styles/tokens.css';
import '@/styles/base.css';
import '@/styles/print.css';

async function bootstrap() {
  try {
    const cfg = await fetch('/config.json', { cache: 'no-store' }).then((r) => r.json());
    window.__CONFIG__ = cfg;
  } catch {
    window.__CONFIG__ = {
      apiBaseUrl: '/api/v1',
      orgName: 'Koperasi Tani Makmur Sejahtera',
      thermalWidthMm: 80,
      idleLogoutMinutes: 60,
    };
  }

  await bootstrapSession();
  startOutboxSync();

  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <Providers>
          <RouterProvider router={router} />
        </Providers>
      </React.StrictMode>
    );
  }
}

bootstrap();

