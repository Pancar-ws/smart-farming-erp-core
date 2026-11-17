// src/app/layouts/PortalShell.tsx
import { Outlet, useNavigate } from 'react-router-dom';
import { useSession } from '@/core/auth/session';
import { LogOut, Sprout } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function PortalShell() {
  const { user, clear } = useSession();
  const navigate = useNavigate();

  const handleLogout = () => {
    clear();
    navigate('/login');
  };

  const orgName =
    typeof window !== 'undefined' && window.__CONFIG__?.orgName
      ? window.__CONFIG__.orgName
      : 'Koperasi Tani';

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink-900 font-sans">
      {/* Mobile-first Header */}
      <header className="h-14 bg-navy-700 text-white flex items-center justify-between px-4 shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Sprout className="w-5 h-5 text-green-50" />
          <span className="font-bold text-sm tracking-tight">{orgName}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-navy-50 font-medium truncate max-w-[120px]">
            {user?.name}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-white hover:bg-navy-800 p-1.5 h-8 text-xs"
            title="Keluar"
          >
            <LogOut className="w-4 h-4 mr-1" />
            Keluar
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 max-w-xl w-full mx-auto pb-12">
        <Outlet />
      </main>
    </div>
  );
}

