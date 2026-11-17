// src/app/layouts/KioskShell.tsx
import { useEffect, useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { OnlineChip } from '@/components/feedback/OnlineChip';
import { OutboxChip } from '@/components/feedback/OutboxChip';
import { ArrowLeft, Clock } from 'lucide-react';

export function KioskShell() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const orgName =
    typeof window !== 'undefined' && window.__CONFIG__?.orgName
      ? window.__CONFIG__.orgName
      : 'Koperasi Tani';

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink-900 font-sans select-none">
      {/* Kiosk Top Bar */}
      <header className="h-16 bg-navy-700 text-white flex items-center justify-between px-6 shadow-md z-20">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-1.5 rounded-control bg-navy-800 hover:bg-navy-900 text-white text-sm font-semibold transition-colors border border-navy-50/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Keluar mode timbang</span>
          </Link>
          <div className="border-l border-white/20 pl-4">
            <h1 className="text-base font-bold leading-tight tracking-wide">{orgName}</h1>
            <p className="text-xs text-navy-50/80 font-medium">Stasiun Penimbangan Panen Digital</p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5 text-xs text-navy-50/90 font-mono bg-navy-800 px-3 py-1.5 rounded-control">
            <Clock className="w-3.5 h-3.5 text-navy-50" />
            <span>{time} WIB</span>
          </div>
          <OnlineChip />
          <OutboxChip />
        </div>
      </header>

      {/* Fullscreen Body */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

