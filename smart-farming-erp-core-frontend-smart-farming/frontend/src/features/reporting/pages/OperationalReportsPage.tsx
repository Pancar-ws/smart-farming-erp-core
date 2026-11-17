// src/features/reporting/pages/OperationalReportsPage.tsx
import { Button } from '@/components/ui/Button';
import { BarChart3, Download } from 'lucide-react';
import { downloadReport } from '@/core/api/download';

export default function OperationalReportsPage() {
  const reports = [
    { title: 'Laporan Rekapitulasi Setoran Panen', desc: 'Rincian setoran per anggota, komoditas, dan tonase.', path: '/reports/harvest-receipts' },
    { title: 'Laporan Efisiensi & Susut Sortasi', desc: 'Analisis yield output per grade dan persentase afkir.', path: '/reports/sorting-efficiency' },
    { title: 'Laporan Penyaluran Sarana Produksi', desc: 'Distribusi pupuk organik vs kimia ke kelompok tani.', path: '/reports/saprotan-issues' },
    { title: 'Laporan Realisasi Penjualan & DO', desc: 'Rekapitulasi penjualan per segmen retail, modern, dan konsumen.', path: '/reports/sales-summary' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-navy-700" />
          Pusat Laporan Operasional & Analitik
        </h1>
        <p className="text-xs text-ink-600 mt-1">
          Unduh dokumen rekapitulasi data operasional koperasi dalam format Excel (.xlsx) dan PDF resmi.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {reports.map((r, i) => (
          <div key={i} className="rounded-panel border border-line bg-surface p-5 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <h2 className="font-bold text-base text-ink-900">{r.title}</h2>
              <p className="text-xs text-ink-600 mt-1">{r.desc}</p>
            </div>
            <div className="flex gap-2 pt-2 border-t border-line">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadReport(r.path, {}, 'xlsx', r.title)}
                className="gap-1.5 flex-1"
              >
                <Download className="w-3.5 h-3.5" />
                Excel (.xlsx)
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => downloadReport(r.path, {}, 'pdf', r.title)}
                className="gap-1.5 flex-1"
              >
                <Download className="w-3.5 h-3.5" />
                PDF
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

