// src/features/sorting/pages/PackagingPage.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { NumberInput } from '@/components/ui/NumberInput';
import { D, fmtKg } from '@/core/format/money';
import { Package, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PackagingPage() {
  const [submitting, setSubmitting] = useState(false);
  const [lot, setLot] = useState('1');
  const [packSize, setPackSize] = useState('5.00'); // 5 kg per karung
  const [count, setCount] = useState('20'); // 20 karung = 100 kg

  const totalKg = D(packSize).times(D(count));

  const handleSave = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success(`Pengemasan ${count} unit (${fmtKg(totalKg.toString())}) berhasil disimpan.`);
    }, 600);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
          <Package className="w-6 h-6 text-navy-700" />
          Pengemasan Produk (Packaging)
        </h1>
        <p className="text-xs text-ink-600 mt-1">
          Pengelompokan komoditas hasil sortasi ke dalam satuan kemasan (karung, peti, kemasan ritel).
        </p>
      </div>

      <div className="rounded-panel border border-line bg-surface p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-semibold text-ink-900 mb-1">
            Pilih Lot Hasil Sortasi
          </label>
          <Select
            options={[
              { value: '1', label: 'BATCH-20261114-001 - Cabai Grade A (Tersedia: 700 kg)' },
              { value: '2', label: 'BATCH-20261114-001 - Cabai Grade B (Tersedia: 200 kg)' },
            ]}
            value={lot}
            onChange={(e) => setLot(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink-900 mb-1">
              Satuan / Ukuran per Kemasan
            </label>
            <NumberInput
              value={packSize}
              onChange={setPackSize}
              unit="kg"
              placeholder="0,00"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-900 mb-1">
              Jumlah Kemasan yang Dikemas
            </label>
            <NumberInput
              value={count}
              onChange={setCount}
              unit="unit"
              placeholder="0"
              maxDp={0}
            />
          </div>
        </div>

        <div className="p-4 rounded-control bg-canvas border border-line flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-ink-600 uppercase">Total Bobot Dikemas</p>
            <p className="text-[11px] text-ink-600">Ukuran × Jumlah Unit</p>
          </div>
          <p className="readout text-2xl font-bold text-navy-800">
            {fmtKg(totalKg.toString())}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-900 mb-1">
            Bahan Kemasan yang Digunakan
          </label>
          <Select
            options={[
              { value: '1', label: 'Karung Waring Merah 5 kg (Stok: 450 lembar)' },
              { value: '2', label: 'Peti Kayu Standar Ekspor 10 kg (Stok: 80 unit)' },
            ]}
            value="1"
            onChange={() => {}}
          />
        </div>

        <Button
          variant="primary"
          size="lg"
          loading={submitting}
          onClick={handleSave}
          className="w-full font-bold gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          Simpan Transaksi Pengemasan
        </Button>
      </div>
    </div>
  );
}

