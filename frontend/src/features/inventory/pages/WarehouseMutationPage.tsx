// src/features/inventory/pages/WarehouseMutationPage.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { NumberInput } from '@/components/ui/NumberInput';
import { ArrowLeftRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function WarehouseMutationPage() {
  const [submitting, setSubmitting] = useState(false);
  const [qty, setQty] = useState('100.00');

  const handleTransfer = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success('Mutasi stok antar-gudang berhasil diposting!');
    }, 600);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
          <ArrowLeftRight className="w-6 h-6 text-navy-700" />
          Mutasi Stok Antar-Gudang
        </h1>
        <p className="text-xs text-ink-600 mt-1">
          Perpindahan fisik komoditas atau saprotan antar lokasi penyimpanan tanpa mereset umur FIFO.
        </p>
      </div>

      <div className="rounded-panel border border-line bg-surface p-6 shadow-sm space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink-900 mb-1">
              Gudang Asal (Sumber)
            </label>
            <Select
              options={[{ value: '1', label: 'GD-MTH - Gudang Panen Mentah' }]}
              value="1"
              onChange={() => {}}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-900 mb-1">
              Gudang Tujuan (Penerima)
            </label>
            <Select
              options={[{ value: '2', label: 'GD-SRT - Gudang Hasil Sortasi' }]}
              value="2"
              onChange={() => {}}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-900 mb-1">
            Pilih Batch / Lot Komoditas
          </label>
          <Select
            options={[
              { value: '1', label: 'BATCH-20261114-001 - Cabai Mentah (Stok: 1.000 kg)' },
            ]}
            value="1"
            onChange={() => {}}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-900 mb-1">
            Kuantitas yang Dipindahkan
          </label>
          <NumberInput value={qty} onChange={setQty} unit="kg" />
        </div>

        <Button
          variant="primary"
          size="lg"
          loading={submitting}
          onClick={handleTransfer}
          className="w-full font-bold gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          Posting Mutasi Gudang
        </Button>
      </div>
    </div>
  );
}

