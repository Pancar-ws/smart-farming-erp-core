// src/features/settings/pages/SystemSettingsPage.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { NumberInput } from '@/components/ui/NumberInput';
import { Settings, Save, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SystemSettingsPage() {
  const [submitting, setSubmitting] = useState(false);
  const [dueDays, setDueDays] = useState('14');
  const [maxLossPct, setMaxLossPct] = useState('15.00');

  const handleSave = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success('Pengaturan konfigurasi sistem berhasil disimpan!');
    }, 500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-navy-700" />
          Pengaturan Konfigurasi Sistem ERP
        </h1>
        <p className="text-xs text-ink-600 mt-1">
          Parameter operasional, aturan masa jatuh tempo, dan batas toleransi susut pasca panen.
        </p>
      </div>

      <div className="rounded-panel border border-line bg-surface p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-semibold text-ink-900 mb-1">
            Standar Jatuh Tempo Pembayaran Hasil Panen (Hari)
          </label>
          <NumberInput value={dueDays} onChange={setDueDays} unit="hari" maxDp={0} />
          <p className="text-[11px] text-ink-600 mt-1">
            Batas waktu maksimum koperasi menyelesaikan pembayaran ke anggota setelah posting sortasi.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-900 mb-1">
            Ambang Batas Maksimum Susut Sortasi (Food Loss Alert %)
          </label>
          <NumberInput value={maxLossPct} onChange={setMaxLossPct} unit="%" maxDp={2} />
          <p className="text-[11px] text-ink-600 mt-1">
            Sistem akan memicu peringatan ESG jika persentase afkir melebihi ambang batas ini.
          </p>
        </div>

        <div className="pt-2 border-t border-line">
          <Button
            variant="primary"
            size="md"
            loading={submitting}
            onClick={handleSave}
            className="gap-2 font-bold"
          >
            <Save className="w-4 h-4" />
            Simpan Perubahan Pengaturan
          </Button>
        </div>
      </div>
    </div>
  );
}

