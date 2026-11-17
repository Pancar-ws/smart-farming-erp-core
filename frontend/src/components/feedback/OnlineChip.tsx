// src/components/feedback/OnlineChip.tsx
import { useOnline } from '@/core/offline/useOnline';
import { Wifi, WifiOff } from 'lucide-react';

export function OnlineChip() {
  const online = useOnline();

  if (online) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">
        <span className="w-2 h-2 rounded-full bg-green-700 animate-pulse" />
        <Wifi className="w-3.5 h-3.5" />
        <span>Online</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800"
      title="Data disimpan di perangkat dan dikirim otomatis saat online"
    >
      <span className="w-2 h-2 rounded-full bg-amber-800" />
      <WifiOff className="w-3.5 h-3.5" />
      <span>Offline</span>
    </span>
  );
}

