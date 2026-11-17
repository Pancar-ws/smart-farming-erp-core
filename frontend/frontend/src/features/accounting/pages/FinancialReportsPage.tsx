// src/features/accounting/pages/FinancialReportsPage.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { fmtIdr } from '@/core/format/money';
import { FileBarChart, Download, CheckCircle2 } from 'lucide-react';
import { downloadReport } from '@/core/api/download';

export default function FinancialReportsPage() {
  const [tab, setTab] = useState<'INCOME' | 'BALANCE' | 'MARGIN'>('INCOME');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
            <FileBarChart className="w-6 h-6 text-navy-700" />
            Laporan Keuangan Koperasi
          </h1>
          <p className="text-xs text-ink-600 mt-1">
            Neraca saldo, laporan laba rugi usaha komoditas, dan analisis margin per batch.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadReport('/reports/income-statement', {}, 'xlsx', 'Laba_Rugi')}
            className="gap-1.5"
          >
            <Download className="w-4 h-4" />
            Ekspor Excel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => downloadReport('/reports/income-statement', {}, 'pdf', 'Laba_Rugi')}
            className="gap-1.5"
          >
            <Download className="w-4 h-4" />
            Unduh PDF
          </Button>
        </div>
      </div>

      <div className="flex border-b border-line gap-4">
        <button
          onClick={() => setTab('INCOME')}
          className={`pb-3 text-sm font-bold border-b-2 cursor-pointer ${
            tab === 'INCOME' ? 'border-navy-700 text-navy-700' : 'border-transparent text-ink-600'
          }`}
        >
          Laba Rugi Usaha
        </button>
        <button
          onClick={() => setTab('BALANCE')}
          className={`pb-3 text-sm font-bold border-b-2 cursor-pointer ${
            tab === 'BALANCE' ? 'border-navy-700 text-navy-700' : 'border-transparent text-ink-600'
          }`}
        >
          Neraca Saldo
        </button>
        <button
          onClick={() => setTab('MARGIN')}
          className={`pb-3 text-sm font-bold border-b-2 cursor-pointer ${
            tab === 'MARGIN' ? 'border-navy-700 text-navy-700' : 'border-transparent text-ink-600'
          }`}
        >
          Margin per Batch Cabai (17,26%)
        </button>
      </div>

      {tab === 'MARGIN' && (
        <div className="rounded-panel border border-line bg-surface p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-line">
            <div>
              <span className="text-xs font-bold text-navy-700 uppercase">Batch Pelacakan:</span>
              <p className="font-mono font-bold text-lg text-ink-900">BATCH-20261114-001</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700">
              <CheckCircle2 className="w-4 h-4" />
              Margin Bersih: 17,26%
            </span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-600">Total Pendapatan Penjualan (Grade A + B)</span>
              <span className="font-mono font-bold text-ink-900">{fmtIdr('39400000.00')}</span>
            </div>
            <div className="flex justify-between text-coral-700">
              <span>Beban Pokok Pembelian (HPP Petani)</span>
              <span className="font-mono font-bold">- {fmtIdr('32600000.00')}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-line text-base font-extrabold text-green-700">
              <span>Laba Kotor Operasional Koperasi</span>
              <span className="font-mono">{fmtIdr('6800000.00')} (17,26%)</span>
            </div>
          </div>
        </div>
      )}

      {tab === 'INCOME' && (
        <div className="rounded-panel border border-line bg-surface p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-base text-ink-900">Ringkasan Laba Rugi Berjalan</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-600">Pendapatan Penjualan Bersih</span>
              <span className="font-mono font-bold text-ink-900">{fmtIdr('39400000.00')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-600">HPP Komoditas</span>
              <span className="font-mono text-ink-900">{fmtIdr('32600000.00')}</span>
            </div>
            <div className="flex justify-between font-bold text-green-700 pt-2 border-t border-line">
              <span>Surplus Operasional</span>
              <span className="font-mono">{fmtIdr('6800000.00')}</span>
            </div>
          </div>
        </div>
      )}

      {tab === 'BALANCE' && (
        <div className="rounded-panel border border-line bg-surface p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-green-700 font-bold text-sm bg-green-50 p-3 rounded-control border border-green-200">
            <CheckCircle2 className="w-5 h-5" />
            Neraca Seimbang (Check = Rp0)
          </div>
          <p className="text-xs text-ink-600">
            Total Aktiva sama persis dengan total Kewajiban ditambah Ekuitas Koperasi.
          </p>
        </div>
      )}
    </div>
  );
}

