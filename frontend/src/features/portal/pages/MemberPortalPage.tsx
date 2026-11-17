// src/features/portal/pages/MemberPortalPage.tsx
import { useState } from 'react';
import { useSession } from '@/core/auth/session';
import { fmtIdr, fmtKg } from '@/core/format/money';
import { fmtDate } from '@/core/format/date';
import { Sprout, Scale, Wallet, Truck, FileText, CheckCircle2 } from 'lucide-react';

export default function MemberPortalPage() {
  const { user } = useSession();
  const [activeTab, setActiveTab] = useState<'PANEN' | 'SAPROTAN' | 'KEUANGAN'>('PANEN');

  // Rekap ringkasan petani
  const summary = {
    total_harvest_kg: '14250.00',
    total_harvest_val: '468000000.00',
    total_paid: '435400000.00',
    unpaid_crop_payable: '32600000.00',
    active_saprotan_loan: '2500000.00',
  };

  const harvests = [
    {
      date: '2026-11-14',
      batch: 'BATCH-20261114-001',
      commodity: 'Cabai Merah Keriting',
      net_kg: '1000.00',
      grades: 'A: 700 kg, B: 200 kg, Afkir: 100 kg',
      value: '32600000.00',
      status: 'Menunggu Pembayaran',
    },
    {
      date: '2026-11-05',
      batch: 'BATCH-20261105-002',
      commodity: 'Cabai Merah Keriting',
      net_kg: '850.00',
      grades: 'A: 600 kg, B: 200 kg, Afkir: 50 kg',
      value: '28800000.00',
      status: 'Lunas',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Kartu Profil Petani */}
      <div className="rounded-panel border border-line bg-surface p-5 shadow-sm space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-50 text-green-700 flex items-center justify-center font-bold text-lg border border-green-200">
            {user?.name?.slice(0, 2).toUpperCase() || 'BT'}
          </div>
          <div>
            <h1 className="text-lg font-bold text-ink-900 leading-tight">{user?.name}</h1>
            <p className="text-xs text-ink-600 font-mono">Kode Anggota: AGT-00001 · Lahan: 1,20 ha</p>
          </div>
        </div>
      </div>

      {/* Ringkasan Keuangan Petani */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-panel bg-surface border border-line shadow-sm">
          <span className="text-[11px] font-bold text-ink-600 uppercase">Hutang Panen Terbuka</span>
          <p className="readout text-lg font-bold text-navy-800 mt-1">
            {fmtIdr(summary.unpaid_crop_payable)}
          </p>
          <span className="text-[10px] text-green-700 font-semibold block mt-1">
            Siap dicairkan koperasi
          </span>
        </div>

        <div className="p-4 rounded-panel bg-surface border border-line shadow-sm">
          <span className="text-[11px] font-bold text-ink-600 uppercase">Tagihan Saprotan</span>
          <p className="readout text-lg font-bold text-coral-700 mt-1">
            {fmtIdr(summary.active_saprotan_loan)}
          </p>
          <span className="text-[10px] text-ink-600 block mt-1">Pupuk & benih berjalan</span>
        </div>
      </div>

      {/* Tab Navigasi Sederhana */}
      <div className="flex border-b border-line bg-surface rounded-t-panel p-1">
        <button
          onClick={() => setActiveTab('PANEN')}
          className={`flex-1 py-2 text-xs font-bold rounded-control transition-colors ${
            activeTab === 'PANEN' ? 'bg-navy-700 text-white shadow-sm' : 'text-ink-600 hover:text-ink-900'
          }`}
        >
          Riwayat Panen
        </button>
        <button
          onClick={() => setActiveTab('SAPROTAN')}
          className={`flex-1 py-2 text-xs font-bold rounded-control transition-colors ${
            activeTab === 'SAPROTAN' ? 'bg-navy-700 text-white shadow-sm' : 'text-ink-600 hover:text-ink-900'
          }`}
        >
          Saprotan Diterima
        </button>
        <button
          onClick={() => setActiveTab('KEUANGAN')}
          className={`flex-1 py-2 text-xs font-bold rounded-control transition-colors ${
            activeTab === 'KEUANGAN' ? 'bg-navy-700 text-white shadow-sm' : 'text-ink-600 hover:text-ink-900'
          }`}
        >
          Laporan Koperasi
        </button>
      </div>

      {/* Konten Tab */}
      <div className="space-y-3">
        {activeTab === 'PANEN' && (
          <div className="space-y-3">
            {harvests.map((h, i) => (
              <div key={i} className="p-4 rounded-panel bg-surface border border-line shadow-sm space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-sm text-ink-900">{h.commodity}</p>
                    <p className="text-[11px] font-mono text-navy-700">{h.batch}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      h.status === 'Lunas' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-800'
                    }`}
                  >
                    {h.status}
                  </span>
                </div>

                <div className="pt-2 border-t border-dashed border-line text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-ink-600">Tanggal Timbang:</span>
                    <span className="font-medium text-ink-900">{fmtDate(h.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-600">Total Berat:</span>
                    <span className="font-bold text-ink-900">{fmtKg(h.net_kg)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-600">Hasil Grade:</span>
                    <span className="text-ink-900 text-right">{h.grades}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-line font-bold">
                    <span>Nilai Penjualan:</span>
                    <span className="text-navy-800">{fmtIdr(h.value)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'SAPROTAN' && (
          <div className="p-5 rounded-panel bg-surface border border-line shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-ink-900">Penyaluran Sarana Produksi</h3>
            <div className="p-3 rounded-control bg-canvas border border-line text-xs space-y-1.5">
              <div className="flex justify-between font-semibold">
                <span>Pupuk NPK Phonska Plus (2 karung / 100 kg)</span>
                <span>Rp1.450.000</span>
              </div>
              <p className="text-[11px] text-ink-600">Disalurkan pada: {fmtDate('2026-10-25')}</p>
            </div>
            <div className="p-3 rounded-control bg-canvas border border-line text-xs space-y-1.5">
              <div className="flex justify-between font-semibold">
                <span>Pupuk Organik Kompos (10 karung / 250 kg)</span>
                <span>Rp1.050.000</span>
              </div>
              <p className="text-[11px] text-ink-600">Disalurkan pada: {fmtDate('2026-10-20')}</p>
            </div>
          </div>
        )}

        {activeTab === 'KEUANGAN' && (
          <div className="p-5 rounded-panel bg-surface border border-line shadow-sm space-y-3 text-xs leading-relaxed">
            <h3 className="font-bold text-sm text-ink-900">Transparansi Keuangan Koperasi</h3>
            <p className="text-ink-600">
              Sesuai amanat UU Perkoperasian, seluruh data keuangan dan surplus usaha (SHU) disajikan
              terbuka bagi seluruh anggota yang sah.
            </p>
            <div className="p-3.5 rounded-control bg-green-50 border border-green-200 text-green-800 font-medium">
              ✔ Laporan Keuangan Periode Berjalan: Seimbang & Terposting Otomatis.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

