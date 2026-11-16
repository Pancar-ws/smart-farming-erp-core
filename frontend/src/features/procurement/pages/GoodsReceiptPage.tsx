// src/features/procurement/pages/GoodsReceiptPage.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { NumberInput } from '@/components/ui/NumberInput';
import { PackageCheck, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function GoodsReceiptPage() {
  const [submitting, setSubmitting] = useState(false);
  const [qtyReceived, setQtyReceived] = useState('500.00');

  const handleReceive = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success('Penerimaan barang (GR) berhasil dicatat dan stok gudang bertambah!');
    }, 600);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
          <PackageCheck className="w-6 h-6 text-navy-700" />
          Penerimaan Logistik Saprotan (Goods Receipt)
        </h1>
        <p className="text-xs text-ink-600 mt-1">
          Verifikasi fisik kedatangan barang dari vendor dan penambahan otomatis ke stok gudang.
        </p>
      </div>

      <div className="rounded-panel border border-line bg-surface p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-semibold text-ink-900 mb-1">
            Pilih Nomor PO Pembelian Terbuka
          </label>
          <Select
            options={[
              { value: '1', label: 'PO-202611-0001 - PT Petrokimia (NPK 500 kg)' },
            ]}
            value="1"
            onChange={() => {}}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-900 mb-1">
            Gudang Penerimaan
          </label>
          <Select
            options={[
              { value: '1', label: 'GD-SPR - Gudang Saprotan' },
            ]}
            value="1"
            onChange={() => {}}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-900 mb-1">
            Kuantitas Diterima Saat Ini
          </label>
          <NumberInput value={qtyReceived} onChange={setQtyReceived} unit="kg" />
        </div>

        <Button
          variant="primary"
          size="lg"
          loading={submitting}
          onClick={handleReceive}
          className="w-full font-bold gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          Catat Penerimaan Barang Masuk
        </Button>
      </div>
    </div>
  );
}

