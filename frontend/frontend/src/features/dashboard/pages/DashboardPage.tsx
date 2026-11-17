// src/features/dashboard/pages/DashboardPage.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/core/api/client';
import { fmtIdr, fmtKg } from '@/core/format/money';
import { Can } from '@/core/auth/Can';
import {
  Scale,
  ListChecks,
  AlertTriangle,
  Receipt,
  ArrowRight,
  TrendingUp,
  Package,
} from 'lucide-react';

interface DashboardSummary {
  harvest_today_kg: string;
  sorting_queue_count: number;
  low_stock_count: number;
  sales_today_idr: string;
  alerts: Array<{
    id: string;
    level: 'warning' | 'info';
    message: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary>({
    harvest_today_kg: '2450.00',
    sorting_queue_count: 3,
    low_stock_count: 1,
    sales_today_idr: '12400000',
    alerts: [
      { id: '1', level: 'warning', message: 'Pupuk NPK 480 kg ≤ minimum 500 kg di Gudang Saprotan' },
      { id: '2', level: 'warning', message: 'Batch Cabai BATCH-20261112-004 sisa 1 hari masa simpan' },
    ],
  });

  useEffect(() => {
    let active = true;
    const fetchSummary = async () => {
      try {
        const res = await api<DashboardSummary>('/dashboard/summary');
        if (active && res) {
          setData(res);
        }
      } catch {
        // Fallback default state
      }
    };
    fetchSummary();
    const interval = setInterval(fetchSummary, 60_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Beranda Operasional</h1>
          <p className="text-sm text-ink-600 mt-1">
            Ringkasan aktivitas panen, stok, produksi sortasi, dan pergerakan penjualan hari ini.
          </p>
        </div>
      </div>

      {/* 4 Kartu Metrik Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Panen Masuk */}
        <Link
          to="/setoran"
          className="rounded-panel border border-line bg-surface p-5 hover:border-navy-700 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-ink-600">
            <span className="text-xs font-bold uppercase tracking-wider">Panen Masuk Hari Ini</span>
            <div className="p-2 rounded-control bg-navy-50 text-navy-700">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="readout text-2xl font-bold text-ink-900">
              {fmtKg(data.harvest_today_kg)}
            </p>
            <p className="text-xs text-green-700 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Sesuai jadwal penimbangan
            </p>
          </div>
        </Link>

        {/* Antrean Sortasi */}
        <Link
          to="/sortasi"
          className="rounded-panel border border-line bg-surface p-5 hover:border-navy-700 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-ink-600">
            <span className="text-xs font-bold uppercase tracking-wider">Antrean Sortasi</span>
            <div className="p-2 rounded-control bg-navy-50 text-navy-700">
              <ListChecks className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="readout text-2xl font-bold text-ink-900">
              {data.sorting_queue_count} <span className="text-base font-normal text-ink-600">setoran</span>
            </p>
            <p className="text-xs text-navy-700 font-semibold mt-1">
              Menunggu pemilahan grade
            </p>
          </div>
        </Link>

        {/* Peringatan Stok Minimum */}
        <Link
          to="/inventaris/saprotan"
          className="rounded-panel border border-line bg-surface p-5 hover:border-amber-600 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-ink-600">
            <span className="text-xs font-bold uppercase tracking-wider">Di Bawah Stok Minimum</span>
            <div className="p-2 rounded-control bg-amber-50 text-amber-800">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="readout text-2xl font-bold text-amber-800">
              {data.low_stock_count} <span className="text-base font-normal text-ink-600">item</span>
            </p>
            <p className="text-xs text-amber-800 font-semibold mt-1">
              Perlu segera dilakukan PO
            </p>
          </div>
        </Link>

        {/* Omset Hari Ini */}
        <Link
          to="/penjualan"
          className="rounded-panel border border-line bg-surface p-5 hover:border-green-700 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-ink-600">
            <span className="text-xs font-bold uppercase tracking-wider">Omset Penjualan Hari Ini</span>
            <div className="p-2 rounded-control bg-green-50 text-green-700">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="readout text-2xl font-bold text-ink-900">
              {fmtIdr(data.sales_today_idr)}
            </p>
            <p className="text-xs text-green-700 font-semibold mt-1">
              Total sales orders disetujui
            </p>
          </div>
        </Link>
      </div>

      {/* Grid Bawah: Peringatan & Pintasan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri (2 span): Peringatan Operasional */}
        <div className="lg:col-span-2 rounded-panel border border-line bg-surface p-5 shadow-sm">
          <h2 className="text-base font-bold text-ink-900 flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Pemberitahuan & Peringatan Sistem
          </h2>

          <div className="space-y-3">
            {data.alerts.length > 0 ? (
              data.alerts.map((al) => (
                <div
                  key={al.id}
                  className="flex items-start gap-3 p-3.5 rounded-control bg-amber-50/70 border border-amber-200/60 text-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-600 mt-1.5 flex-shrink-0" />
                  <p className="text-amber-800 font-medium leading-relaxed flex-1">
                    {al.message}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink-600 italic py-4">
                Tidak ada peringatan kritis saat ini. Seluruh stok dan batch dalam batas aman.
              </p>
            )}
          </div>
        </div>

        {/* Kolom Kanan (1 span): Pintasan Alur Kerja */}
        <div className="rounded-panel border border-line bg-surface p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-ink-900 mb-4">Pintasan Cepat</h2>
            <div className="space-y-2.5">
              <Can perm="harvest:receive">
                <Link
                  to="/timbang"
                  className="flex items-center justify-between p-3 rounded-control bg-navy-50 hover:bg-navy-700 hover:text-white text-navy-700 text-sm font-semibold transition-all group"
                >
                  <span className="flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    Stasiun Timbang Panen
                  </span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Can>

              <Can perm="mfg:sort">
                <Link
                  to="/sortasi/baru"
                  className="flex items-center justify-between p-3 rounded-control bg-navy-50 hover:bg-navy-700 hover:text-white text-navy-700 text-sm font-semibold transition-all group"
                >
                  <span className="flex items-center gap-2">
                    <ListChecks className="w-4 h-4" />
                    Buat Order Sortasi Baru
                  </span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Can>

              <Can perm="sales:order">
                <Link
                  to="/penjualan/baru"
                  className="flex items-center justify-between p-3 rounded-control bg-navy-50 hover:bg-navy-700 hover:text-white text-navy-700 text-sm font-semibold transition-all group"
                >
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Buat Pesanan Penjualan
                  </span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Can>
            </div>
          </div>

          <div className="pt-4 border-t border-line mt-4 text-xs text-ink-600">
            Gunakan tombol pintasan untuk mempercepat penginputan transaksi harian di gudang atau kantor.
          </div>
        </div>
      </div>
    </div>
  );
}

