// src/app/layouts/AppShell.tsx
import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useSession, can } from '@/core/auth/session';
import { MENU } from '@/core/auth/menu';
import { OnlineChip } from '@/components/feedback/OnlineChip';
import { OutboxChip } from '@/components/feedback/OutboxChip';
import {
  Scale,
  ClipboardList,
  ListChecks,
  Package,
  Sprout,
  Warehouse,
  Truck,
  ArrowLeftRight,
  FileSpreadsheet,
  PackageCheck,
  Receipt,
  Wallet,
  BookOpen,
  FileBarChart,
  PieChart,
  Users,
  Route,
  Leaf,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Scale,
  ClipboardList,
  ListChecks,
  Package,
  Sprout,
  Warehouse,
  Truck,
  ArrowLeftRight,
  FileSpreadsheet,
  PackageCheck,
  Receipt,
  Wallet,
  BookOpen,
  FileBarChart,
  PieChart,
  Users,
  Route,
  Leaf,
  BarChart3,
  Settings,
};

export function AppShell() {
  const { user, clear } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const orgName =
    typeof window !== 'undefined' && window.__CONFIG__?.orgName
      ? window.__CONFIG__.orgName
      : 'Koperasi Tani';

  const handleLogout = () => {
    clear();
    navigate('/login');
  };

  const allowedMenu = MENU.filter((m) => can(user, ...m.any));
  const groups = Array.from(new Set(allowedMenu.map((m) => m.group)));

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink-900 font-sans">
      {/* Header Navy */}
      <header className="h-16 bg-navy-700 text-white flex items-center justify-between px-4 sm:px-6 shadow-md z-30 sticky top-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-control hover:bg-navy-800 text-white focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <span className="w-7 h-7 rounded-control bg-white text-navy-700 flex items-center justify-center font-black text-sm">
              KT
            </span>
            <span>{orgName}</span>
          </Link>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <OnlineChip />
          <OutboxChip />

          <button
            className="p-1.5 rounded-control text-white/90 hover:text-white hover:bg-navy-800 relative transition-colors"
            title="Pemberitahuan"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-600" />
          </button>

          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-control hover:bg-navy-800 transition-colors text-sm"
            >
              <div className="w-7 h-7 rounded-full bg-navy-800 text-white font-bold flex items-center justify-center border border-navy-50/20 text-xs">
                {user?.name?.slice(0, 2).toUpperCase() || 'US'}
              </div>
              <div className="hidden md:block text-left">
                <p className="font-semibold leading-tight text-xs">{user?.name || 'Pengguna'}</p>
                <p className="text-[10px] text-navy-50/80">{user?.role || 'Guest'}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-navy-50/70" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-panel bg-white shadow-xl border border-line py-1 z-50 text-ink-900 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-line">
                  <p className="font-bold text-xs truncate">{user?.name}</p>
                  <p className="text-[11px] text-ink-600 truncate">{user?.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-coral-700 hover:bg-coral-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar dari Sistem
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Desktop */}
        <aside
          className={`fixed inset-y-0 left-0 top-16 z-20 w-64 bg-surface border-r border-line flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {groups.map((group) => {
              const groupItems = allowedMenu.filter((m) => m.group === group);
              return (
                <div key={group} className="space-y-1">
                  <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-ink-600/70">
                    {group}
                  </p>
                  {groupItems.map((item) => {
                    const Icon = ICON_MAP[item.icon] || ClipboardList;
                    const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-control text-sm font-medium transition-colors ${
                          active
                            ? 'bg-navy-50 text-navy-700 font-semibold border-l-4 border-navy-700'
                            : 'text-ink-600 hover:bg-navy-50/60 hover:text-ink-900'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${active ? 'text-navy-700' : 'text-ink-600'}`} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="p-3 border-t border-line text-[11px] text-ink-600 flex justify-between items-center bg-canvas/30">
            <span>ERP Koperasi v1.0</span>
            <span className="font-semibold text-green-700">Aktif</span>
          </div>
        </aside>

        {/* Overlay backdrop for mobile menu */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/40 z-10 lg:hidden"
          />
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

