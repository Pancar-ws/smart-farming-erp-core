// src/features/accounting/pages/SHUCalculationPage.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { fmtIdr } from '@/core/format/money';
import { PieChart, Calculator } from 'lucide-react';
import { toast } from 'sonner';

export default function SHUCalculationPage() {
  const [calculating, setCalculating] = useState(false);

  const handleCalculate = () => {
    setCalculating(true);
    setTimeout(() => {
      setCalculating(false);
      toast.success('Kalkulasi simulasi pembagian SHU anggota berhasil dihitung!');
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
            <PieChart className="w-6 h-6 text-navy-700" />
            Perhitungan SHU (Sisa Hasil Usaha)
          </h1>
          <p className="text-xs text-ink-600 mt-1">
            Alokasi surplus tahunan proporsional berbasis jasa simpanan dan partisipasi transaksi anggota.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          loading={calculating}
          onClick={handleCalculate}
          className="gap-2 font-bold"
        >
          <Calculator className="w-4 h-4" />
          Hitung Alokasi SHU
        </Button>
      </div>

      <div className="rounded-panel border border-line bg-surface p-6 shadow-sm space-y-4">
        <h2 className="font-bold text-base text-ink-900">Komposisi Pembagian SHU Sesuai AD/ART</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-canvas rounded-control border border-line">
            <span className="text-xs text-ink-600 block">Jasa Usaha / Transaksi</span>
            <span className="font-bold text-navy-700 text-lg">40%</span>
          </div>
          <div className="p-3 bg-canvas rounded-control border border-line">
            <span className="text-xs text-ink-600 block">Jasa Modal / Simpanan</span>
            <span className="font-bold text-navy-700 text-lg">25%</span>
          </div>
          <div className="p-3 bg-canvas rounded-control border border-line">
            <span className="text-xs text-ink-600 block">Cadangan Koperasi</span>
            <span className="font-bold text-navy-700 text-lg">20%</span>
          </div>
          <div className="p-3 bg-canvas rounded-control border border-line">
            <span className="text-xs text-ink-600 block">Dana Sosial & Pendidikan</span>
            <span className="font-bold text-navy-700 text-lg">15%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

