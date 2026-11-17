// src/features/inventory/pages/IssueSaprotanPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { NumberInput } from '@/components/ui/NumberInput';
import { D, fmtIdr } from '@/core/format/money';
import { Truck, CheckCircle2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function IssueSaprotanPage() {
  const navigate = useNavigate();
  const [member, setMember] = useState('1'); // Budi Santoso
  const [qty, setQty] = useState('2');
  const [submitting, setSubmitting] = useState(false);

  const pricePerUnit = '145000'; // Pupuk NPK 50kg
  const totalPrice = D(qty).times(D(pricePerUnit));

  const handleIssue = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success(
        `Penyaluran saprotan berhasil! Piutang petani tercatat sebesar ${fmtIdr(
          totalPrice.toString()
        )}.`
      );
      navigate('/inventaris/saprotan');
    }, 600);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/inventaris/saprotan')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Kembali
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Penyaluran Saprotan ke Petani</h1>
          <p className="text-xs text-ink-600">
            Pemberian pupuk atau benih subsidi/pinjaman yang otomatis membentuk piutang anggota.
          </p>
        </div>
      </div>

      <div className="rounded-panel border border-line bg-surface p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-semibold text-ink-900 mb-1">
            Pilih Anggota Penerima
          </label>
          <Select
            options={[
              { value: '1', label: 'AGT-00001 - Budi Santoso (Lahan: 1,20 ha)' },
              { value: '2', label: 'AGT-00002 - Siti Aminah (Lahan: 0,80 ha)' },
            ]}
            value={member}
            onChange={(e) => setMember(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-900 mb-1">
            Pilih Sarana Produksi (Saprotan)
          </label>
          <Select
            options={[
              { value: '1', label: 'Pupuk NPK Phonska Plus 50kg (Stok: 480 kg)' },
              { value: '2', label: 'Pupuk Organik Kompos Super 25kg (Stok: 1.850 kg)' },
            ]}
            value="1"
            onChange={() => {}}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-900 mb-1">
            Jumlah yang Disalurkan (Karung/Unit)
          </label>
          <NumberInput value={qty} onChange={setQty} unit="karung" maxDp={0} />
        </div>

        <div className="p-4 rounded-control bg-canvas border border-line flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-ink-600 uppercase">Total Piutang Terbentuk</p>
            <p className="text-[11px] text-ink-600">Dipotong saat pembayaran panen</p>
          </div>
          <p className="readout text-2xl font-bold text-navy-800">
            {fmtIdr(totalPrice.toString())}
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          loading={submitting}
          onClick={handleIssue}
          className="w-full font-bold gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          Konfirmasi Penyaluran Saprotan
        </Button>
      </div>
    </div>
  );
}

