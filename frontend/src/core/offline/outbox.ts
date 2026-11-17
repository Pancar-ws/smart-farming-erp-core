// src/core/offline/outbox.ts
import { createStore, get, set, del, entries } from 'idb-keyval';
import { api } from '@/core/api/client';
import { ApiError } from '@/core/api/errors';
import { messageFor } from '@/core/i18n/id';
import { useSession } from '@/core/auth/session';

const store = createStore('erp-outbox', 'items');

export interface OutboxItem {
  id: string; // client_request_id
  kind: 'harvest-receipt';
  payload: Record<string, unknown>;
  createdAt: number;
  attempts: number;
  nextAt: number;
  status: 'pending' | 'failed';
  lastError?: string;
  result?: { batch_code?: string };
}

export const outbox = {
  async enqueue(i: Pick<OutboxItem, 'id' | 'kind' | 'payload'>) {
    await set(
      i.id,
      {
        ...i,
        createdAt: Date.now(),
        attempts: 0,
        nextAt: 0,
        status: 'pending',
      } satisfies OutboxItem,
      store
    );
  },

  all: async (): Promise<OutboxItem[]> => {
    const list = await entries<string, OutboxItem>(store);
    return list.map(([, v]) => v).sort((a, b) => a.createdAt - b.createdAt);
  },

  remove: (id: string) => del(id, store),

  async flush() {
    for (const it of await this.all()) {
      if (it.status !== 'pending' || it.nextAt > Date.now()) continue;
      try {
        const r = await api<{ batch_code: string }>('/procurement/harvest-receipts', {
          method: 'POST',
          json: it.payload,
        });
        await del(it.id, store);
        window.dispatchEvent(new CustomEvent('outbox-synced', { detail: { item: it, result: r } }));
      } catch (e) {
        if (e instanceof ApiError && !e.isRetryable && ![401, 408, 429].includes(e.status)) {
          await set(it.id, { ...it, status: 'failed', lastError: messageFor(e.code, e.message) }, store);
        } else {
          const attempts = it.attempts + 1;
          await set(
            it.id,
            {
              ...it,
              attempts,
              nextAt: Date.now() + Math.min(2 ** attempts * 5_000, 5 * 60_000),
            },
            store
          );
        }
      }
    }
  },
};

export function startOutboxSync() {
  const tick = () => {
    if (typeof navigator !== 'undefined' && navigator.onLine && useSession.getState().user) {
      outbox.flush();
    }
  };
  window.addEventListener('online', tick);
  const t = setInterval(tick, 15_000);
  tick();
  return () => {
    window.removeEventListener('online', tick);
    clearInterval(t);
  };
}

