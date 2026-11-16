// src/features/harvest/pages/WeighStationPage.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useScale, ScaleStatus } from '@/core/hardware/useScale';
import { useBarcodeWedge } from '@/core/hardware/useBarcodeWedge';
import { useOnline } from '@/core/offline/useOnline';
import { outbox } from '@/core/offline/outbox';
import { api } from '@/core/api/client';
import { ApiError } from '@/core/api/errors';
import { messageFor } from '@/core/i18n/id';
import { D, fmtKg } from '@/core/format/money';
import { normalizeDecimal } from '@/core/format/input';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { NumberInput } from '@/components/ui/NumberInput';
import { Select } from '@/components/ui/Select';
import { NotaTimbang } from '@/core/print/templates/NotaTimbang';
import { usePrint } from '@/core/print/usePrint';
import {
  CheckCircle2,
  Loader2,
  Printer,
  QrCode,
  RotateCcw,
  Scale as ScaleIcon,
  Search,
  WifiOff,
} from 'lucide-react';
import { toast } from 'sonner';

export const harvestSchema = z
  .object({
    member_code: z.string().min(1, 'Pilih anggota terlebih dahulu'),
    product_id: z.coerce.number().min(1, 'Pilih komoditas'),
    warehouse_id: z.coerce.number().min(1, 'Pilih gudang penerimaan'),
    gross_kg: z
      .string()
      .min(1, 'Berat kotor wajib diisi')
      .refine((v) => D(v).gt(0), 'Berat kotor harus lebih dari 0'),
    tare_kg: z.string().default('0'),
    moisture_pct: z
      .string()
      .optional()
      .refine((v) => !v || (D(v).gte(0) && D(v).lte(100)), 'Maksimal 100%'),
  })
  .refine((v) => D(v.gross_kg).gt(D(v.tare_kg || '0')), {
    path: ['tare_kg'],
    message: 'Tara harus lebih kecil dari berat kotor',
  });

type HarvestForm = z.infer<typeof harvestSchema>;

interface HarvestResult {
  id?: number;
  receipt_no: string;
  batch_code: string;
  received_at: string;
  gross_kg: string;
  tare_kg: string;
  net_kg: string;
  queued?: boolean;
  localRef?: string;
}

export function Readout({
  kg,
  stable,
  status,
}: {
  kg: string | null;
  stable: boolean;
  status: ScaleStatus;
}) {
  return (
    <div className="rounded-panel border-2 border-line bg-surface p-6 sm:p-8 text-right shadow-sm select-none">
      <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-600">
          Indikator Timbangan Digital
        </span>
        <span
          role="status"
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            stable
              ? 'bg-green-50 text-green-700'
              : status === 'connected'
              ? 'bg-amber-50 text-amber-800'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {stable ? (
            <CheckCircle2 className="w-4 h-4 text-green-700" />
          ) : status === 'connected' ? (
            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
          ) : (
            <ScaleIcon className="w-4 h-4" />
          )}
          {stable
            ? 'Stabil'
            : status === 'connected'
            ? 'Menimbang...'
            : 'Timbangan Belum Tersambung'}
        </span>
      </div>

      <div className="py-2">
        <p
          className="readout font-extrabold leading-none text-ink-900 tracking-tight"
          style={{ fontSize: 'clamp(56px, 8vw, 104px)' }}
          aria-hidden="true"
        >
          {kg ? fmtKg(kg).replace(' kg', '') : '0,00'}
          <span className="text-3xl sm:text-4xl text-ink-600 ml-3 font-semibold">kg</span>
        </p>
      </div>
    </div>
  );
}

export default function WeighStationPage() {
  const scale = useScale();
  const online = useOnline();
  const print = usePrint();

  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [result, setResult] = useState<HarvestResult | null>(null);
  const [memberSearch, setMemberSearch] = useState('');

  // Sample lookup options (normally from /master/lookups)
  const [members] = useState([
    { code: 'AGT-00001', name: 'Budi Santoso', commodity: 'Cabai Merah', land: '1,20 ha', status: 'AKTIF' },
    { code: 'AGT-00002', name: 'Siti Aminah', commodity: 'Bawang Merah', land: '0,80 ha', status: 'AKTIF' },
    { code: 'AGT-00003', name: 'Ahmad Fauzi', commodity: 'Padi Ciherang', land: '2,00 ha', status: 'AKTIF' },
  ]);

  const [products] = useState([
    { id: 1, name: 'Cabai Merah Keriting' },
    { id: 2, name: 'Bawang Merah Brebes' },
    { id: 3, name: 'Beras Medium Pandan' },
  ]);

  const [warehouses] = useState([
    { id: 1, name: 'Gudang Panen Mentah (GD-MTH)' },
    { id: 2, name: 'Gudang Sentral Koperasi (GD-UTM)' },
  ]);

  const form = useForm<HarvestForm>({
    resolver: zodResolver(harvestSchema),
    defaultValues: {
      member_code: 'AGT-00001',
      product_id: 1,
      warehouse_id: 1,
      gross_kg: '',
      tare_kg: '0',
      moisture_pct: '',
    },
  });

  const gross = form.watch('gross_kg');
  const tare = form.watch('tare_kg');
  const netPreview = D(gross).minus(D(tare));

  // Barcode Wedge listener
  useBarcodeWedge((scanned) => {
    if (scanned.startsWith('AGT-')) {
      form.setValue('member_code', scanned);
      setMemberSearch(scanned);
      toast.success(`Anggota dipindai: ${scanned}`);
    }
  });

  // Keyboard shortcut F2 (ambil berat) & Ctrl+Enter (simpan)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F2' && scale.kg) {
        e.preventDefault();
        form.setValue('gross_kg', scale.kg);
      }
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        form.handleSubmit(onSave)();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [scale.kg, form]);

  const selectedMember = members.find((m) => m.code === form.watch('member_code'));
  const selectedProduct = products.find((p) => p.id === Number(form.watch('product_id')));

  const onSave = async (v: HarvestForm) => {
    try {
      const payload = {
        client_request_id: requestId,
        member_code: v.member_code,
        product_id: v.product_id,
        warehouse_id: v.warehouse_id,
        gross_kg: v.gross_kg,
        tare_kg: v.tare_kg,
        moisture_pct: v.moisture_pct || null,
      };

      const res = await api<HarvestResult>('/procurement/harvest-receipts', {
        method: 'POST',
        json: payload,
      });

      setResult(res);
      toast.success(`Setoran tersimpan! Batch: ${res.batch_code}`);
    } catch (err) {
      if (err instanceof ApiError && err.isNetwork) {
        // Simpan offline ke IndexedDB
        await outbox.enqueue({
          id: requestId,
          kind: 'harvest-receipt',
          payload: {
            ...v,
            client_request_id: requestId,
          },
        });
        setResult({
          receipt_no: `STR-OFF-${requestId.slice(0, 8)}`,
          batch_code: `BATCH-OFFLINE-${requestId.slice(0, 6)}`,
          received_at: new Date().toISOString(),
          gross_kg: v.gross_kg,
          tare_kg: v.tare_kg,
          net_kg: netPreview.toString(),
          queued: true,
          localRef: requestId.slice(0, 8),
        });
        toast.info('Koneksi terputus. Data setoran aman di antrean lokal.');
      } else if (err instanceof ApiError) {
        toast.error(messageFor(err.code, err.message));
      } else {
        toast.error('Gagal menyimpan setoran panen.');
      }
    }
  };

  const resetForm = () => {
    setResult(null);
    setRequestId(crypto.randomUUID());
    form.reset({
      member_code: 'AGT-00001',
      product_id: 1,
      warehouse_id: 1,
      gross_kg: '',
      tare_kg: '0',
      moisture_pct: '',
    });
  };

  return (
    <div className="max-w-6xl w-full mx-auto space-y-6">
      {result ? (
        /* ================= TAMPILAN SETELAH BERHASIL MENIMBANG ================= */
        <div className="rounded-panel border border-line bg-surface p-8 shadow-md text-center max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-full bg-green-50 text-green-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-ink-900">
              {result.queued ? 'Setoran Disimpan di Antrean Lokal' : 'Setoran Panen Berhasil Diterima!'}
            </h2>
            <p className="text-sm text-ink-600 mt-1">
              {result.queued
                ? 'Nomor batch resmi akan diterbitkan otomatis setelah perangkat kembali online.'
                : 'Nomor batch resmi telah diterbitkan oleh sistem.'}
            </p>
          </div>

          <div className="p-5 rounded-control bg-navy-50/70 border border-line space-y-2">
            <p className="text-xs uppercase font-bold tracking-wider text-ink-600">Nomor Batch Pelacakan</p>
            <p className="readout text-3xl font-extrabold text-navy-800 tracking-wide font-mono">
              {result.batch_code}
            </p>
            <div className="flex justify-center gap-6 text-sm text-ink-900 pt-2 border-t border-navy-500/20">
              <span>
                Berat Bersih: <b>{fmtKg(result.net_kg)}</b>
              </span>
              <span>
                Anggota: <b>{selectedMember?.name}</b>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => print('thermal80')}
              className="gap-2"
            >
              <Printer className="w-5 h-5" />
              Cetak Nota Timbang (Thermal)
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => print('thermal80')}
              className="gap-2"
            >
              <QrCode className="w-5 h-5" />
              Cetak Label Batch (QR)
            </Button>
          </div>

          <div className="pt-4 border-t border-line">
            <Button
              variant="secondary"
              size="md"
              onClick={resetForm}
              className="w-full gap-2 font-bold"
            >
              <RotateCcw className="w-4 h-4" />
              Timbang Setoran Berikutnya (Enter)
            </Button>
          </div>

          {/* Hidden Print Template */}
          <div className="hidden">
            <NotaTimbang
              data={{
                receipt_no: result.receipt_no,
                batch_code: result.batch_code,
                at: result.received_at,
                member: {
                  code: selectedMember?.code || '',
                  name: selectedMember?.name || '',
                },
                commodity: selectedProduct?.name || '',
                gross: result.gross_kg,
                tare: result.tare_kg,
                net: result.net_kg,
                officer: 'Petugas Timbang',
              }}
            />
          </div>
        </div>
      ) : (
        /* ================= FORMULIR UTAMA STASIUN TIMBANG ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Kolom Kiri: Anggota & Komoditas (5 Kolom) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Kartu Anggota */}
            <div className="rounded-panel border border-line bg-surface p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-ink-900">1. Identitas Anggota Tani</h3>
                <span className="text-[11px] font-semibold text-navy-700 bg-navy-50 px-2 py-0.5 rounded">
                  Pindai / Cari
                </span>
              </div>

              <div className="relative">
                <Input
                  placeholder="Ketik nama, kode AGT, atau scan..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="pl-9"
                />
                <Search className="w-4 h-4 text-ink-600 absolute left-3 top-3 pointer-events-none" />
              </div>

              <Select
                options={members.map((m) => ({
                  value: m.code,
                  label: `${m.code} - ${m.name} (${m.commodity})`,
                }))}
                value={form.watch('member_code')}
                onChange={(e) => form.setValue('member_code', e.target.value)}
              />

              {selectedMember && (
                <div className="p-3.5 rounded-control bg-canvas border border-line text-xs space-y-1">
                  <div className="flex justify-between font-semibold text-ink-900">
                    <span>{selectedMember.name}</span>
                    <span className="text-green-700">{selectedMember.status}</span>
                  </div>
                  <p className="text-ink-600">
                    Lahan: {selectedMember.land} · Komoditas Utama: {selectedMember.commodity}
                  </p>
                </div>
              )}
            </div>

            {/* Kartu Komoditas & Gudang */}
            <div className="rounded-panel border border-line bg-surface p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-ink-900">2. Komoditas & Gudang Tujuan</h3>

              <div>
                <label className="block text-xs font-semibold text-ink-900 mb-1">Komoditas Panen</label>
                <Select
                  options={products.map((p) => ({ value: p.id, label: p.name }))}
                  value={form.watch('product_id')}
                  onChange={(e) => form.setValue('product_id', Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-900 mb-1">Gudang Penerimaan</label>
                <Select
                  options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
                  value={form.watch('warehouse_id')}
                  onChange={(e) => form.setValue('warehouse_id', Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Timbangan & Validasi Berat (7 Kolom) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Readout Berat */}
            <Readout kg={scale.kg || gross} stable={scale.stable} status={scale.status} />

            {/* Panel Kontrol Berat */}
            <div className="rounded-panel border border-line bg-surface p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  disabled={!scale.kg}
                  onClick={() => form.setValue('gross_kg', scale.kg || '')}
                  className="gap-2 font-bold flex-1 mr-3"
                >
                  <ScaleIcon className="w-5 h-5" />
                  Ambil Berat Kotor (F2)
                </Button>

                {scale.status === 'unsupported' && (
                  <span className="text-xs text-ink-600 italic">
                    Peramban ini mode manual. Masukkan angka di bawah.
                  </span>
                )}
                {scale.status === 'idle' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={scale.connect}
                  >
                    Sambungkan Port
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-ink-900 mb-1">
                    Berat Kotor (Gross)
                  </label>
                  <NumberInput
                    value={form.watch('gross_kg')}
                    onChange={(v) => form.setValue('gross_kg', v)}
                    unit="kg"
                    placeholder="0,00"
                    invalid={!!form.formState.errors.gross_kg}
                  />
                  {form.formState.errors.gross_kg && (
                    <p className="text-xs text-coral-700 mt-1">
                      {form.formState.errors.gross_kg.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-900 mb-1">
                    Tara Keranjang / Peti
                  </label>
                  <div className="flex gap-2">
                    <NumberInput
                      value={form.watch('tare_kg')}
                      onChange={(v) => form.setValue('tare_kg', v)}
                      unit="kg"
                      placeholder="0,00"
                      invalid={!!form.formState.errors.tare_kg}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={() => form.setValue('tare_kg', scale.kg || '0')}
                      title="Ambil tara dari timbangan"
                    >
                      Tara
                    </Button>
                  </div>
                  {form.formState.errors.tare_kg && (
                    <p className="text-xs text-coral-700 mt-1">
                      {form.formState.errors.tare_kg.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-900 mb-1">
                  Kadar Air (%) <span className="text-ink-600 font-normal">- Opsional</span>
                </label>
                <NumberInput
                  value={form.watch('moisture_pct') || ''}
                  onChange={(v) => form.setValue('moisture_pct', v)}
                  unit="%"
                  placeholder="0,00"
                  maxDp={2}
                />
              </div>

              {/* Rincian Berat Bersih */}
              <div className="p-4 rounded-control bg-canvas border border-line flex items-center justify-between">
                <div>
                  <p className="text-xs text-ink-600 uppercase font-bold tracking-wider">
                    Perkiraan Berat Bersih (Netto)
                  </p>
                  <p className="text-[11px] text-ink-600">Kotor dikurangi tara keranjang</p>
                </div>
                <p className="readout text-3xl font-extrabold text-navy-800">
                  {fmtKg(netPreview.toString())}
                </p>
              </div>

              {/* Tombol Simpan Transaksi */}
              <div className="pt-2">
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  loading={form.formState.isSubmitting}
                  onClick={form.handleSubmit(onSave)}
                  className="w-full h-14 text-base font-bold shadow-md gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Simpan Setoran Panen (Ctrl + Enter)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

