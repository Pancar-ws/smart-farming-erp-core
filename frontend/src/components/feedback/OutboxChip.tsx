// src/components/feedback/OutboxChip.tsx
import { useEffect, useState } from 'react';
import { outbox, OutboxItem } from '@/core/offline/outbox';
import { Inbox, AlertTriangle } from 'lucide-react';

export function OutboxChip() {
  const [items, setItems] = useState<OutboxItem[]>([]);

  const load = () => {
    outbox.all().then(setItems);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    const onSynced = () => load();
    window.addEventListener('outbox-synced', onSynced);
    return () => {
      clearInterval(interval);
      window.removeEventListener('outbox-synced', onSynced);
    };
  }, []);

  const pendingCount = items.filter((i) => i.status === 'pending').length;
  const failedCount = items.filter((i) => i.status === 'failed').length;

  if (items.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      {pendingCount > 0 && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-navy-50 text-navy-700">
          <Inbox className="w-3.5 h-3.5" />
          <span>Antrean {pendingCount}</span>
        </span>
      )}
      {failedCount > 0 && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-coral-50 text-coral-700 animate-bounce">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Gagal {failedCount}</span>
        </span>
      )}
    </div>
  );
}

