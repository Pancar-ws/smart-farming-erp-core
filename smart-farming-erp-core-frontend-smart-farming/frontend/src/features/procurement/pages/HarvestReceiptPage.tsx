// src/features/procurement/pages/HarvestReceiptPage.tsx
// CACA - Modul Procurement & Penerimaan Setoran Panen (Fitur 2)
// Antarmuka pencatatan setoran panen touch-friendly untuk layar sentuh di gudang.
// Tombol "Ambil Berat" terhubung ke alat timbang digital + Auto-Save Draft ke LocalStorage.

import React, { useState, useEffect, useCallback } from 'react';
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
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { NumberInput } from '@/components/ui/NumberInput';
import { Select } from '@/components/ui/Select';
import {
  CheckCircle2,
  Loader2,
  Printer,
  RotateCcw,
  Scale as ScaleIcon,
  Search,
  WifiOff,
  Save,
  AlertCircle,
  PackageCheck,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Konstanta Draft LocalStorage ───────────────────────────────────────────
const DRAFT_KEY = 'harvest_receipt_draft';

// ─── Skema Validasi ──────────────────────────────────────────────────────────
const harvestReceiptSchema = z
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
    notes: z.string().optional(),
  })
  .refine((v) => D(v.gross_kg).gt(D(v.tare_kg || '0')), {
    path: ['tare_kg'],
    message: 'Tara harus lebih kecil dari berat kotor',
  });

type HarvestReceiptForm = z.infer<typeof harvestReceiptSchema>;

interface HarvestResult {
  id?: number;
  receipt_no: string;
  batch_code: string;
  received_at: string;
  gross_kg: string;
  tare_kg: string;
  net_kg: string;
  queued?: boolean;
}

// ─── Komponen Readout Timbangan ───────────────────────────────────────────────
function ScaleReadout({
  kg,
  stable,
  status,
}: {
  kg: string | null;
  stable: boolean;
  status: ScaleStatus;
}) {
  return (
    <div className="rounded-panel border-2 border-line bg-surface p-6 text-right shadow-sm select-none">
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

      <p
        className="font-extrabold leading-none text-ink-900 tracking-tight"
        style={{ fontSize: 'clamp(48px, 8vw, 96px)' }}
        aria-label={`Berat: ${kg ? fmtKg(kg) : '0,00 kg'}`}
      >
        {kg ? fmtKg(kg).replace(' kg', '') : '0,00'}
        <span className="text-3xl text-ink-600 ml-3 font-semibold">kg</span>
      </p>
    </div>
  );
}

// ─── Komponen Banner Peringatan Offline ───────────────────────────────────────
function OfflineBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div
      role="alert"
      className="flex items-center gap-3 px-4 py-3 rounded-panel bg-amber-50 border border-amber-300 text-amber-800 text-sm font-semibold"
    >
      <WifiOff className="w-5 h-5 flex-shrink-0" />
      <span>
        Koneksi internet terputus.{' '}
        <strong>Data akan disimpan ke antrean lokal</strong> dan dikirim otomatis
        saat kembali online.
      </span>
    </div>
  );
}

// ─── Komponen Badge Draft Tersimpan ──────────────────────────────────────────
function DraftBadge({ savedAt }: { savedAt: string | null }) {
  if (!savedAt) return null;
  const time = new Date(savedAt).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-600 bg-canvas border border-line px-2.5 py-1 rounded-full">
      <Save className="w-3.5 h-3.5" />
      Draft disimpan {time}
    </span>
  );
}

// ─── Main Page Component ───────────────────────────────────────────────────────
export default function HarvestReceiptPage() {
  const scale = useScale();
  const online = useOnline();

  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [result, setResult] = useState<HarvestResult | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  // Data lookup (normalnya dari /master/lookups)
  const members = [
    { code: 'AGT-00001', name: 'Budi Santoso', commodity: 'Cabai Merah', land: '1,20 ha', status: 'AKTIF' },
    { code: 'AGT-00002', name: 'Siti Aminah', commodity: 'Bawang Merah', land: '0,80 ha', status: 'AKTIF' },
    { code: 'AGT-00003', name: 'Ahmad Fauzi', commodity: 'Padi Ciherang', land: '2,00 ha', status: 'AKTIF' },
    { code: 'AGT-00004', name: 'Dewi Rahayu', commodity: 'Tomat Cherry', land: '0,50 ha', status: 'AKTIF' },
    { code: 'AGT-00005', name: 'Hendra Gunawan', commodity: 'Jagung Manis', land: '3,00 ha', status: 'NON-AKTIF' },
  ];

  const products = [
    { id: 1, name: 'Cabai Merah Keriting' },
    { id: 2, name: 'Bawang Merah Brebes' },
    { id: 3, name: 'Beras Medium Pandan' },
    { id: 4, name: 'Tomat Cherry' },
    { id: 5, name: 'Jagung Manis' },
  ];

  const warehouses = [
    { id: 1, name: 'Gudang Panen Mentah (GD-MTH)' },
    { id: 2, name: 'Gudang Sentral Koperasi (GD-UTM)' },
    { id: 3, name: 'Gudang Cabang Timur (GD-TIM)' },
  ];

  // ── Form setup ─────────────────────────────────────────────────────────────
  const form = useForm<HarvestReceiptForm>({
    resolver: zodResolver(harvestReceiptSchema),
    defaultValues: {
      member_code: '',
      product_id: 1,
      warehouse_id: 1,
      gross_kg: '',
      tare_kg: '0',
      moisture_pct: '',
      notes: '',
    },
  });

  const gross = form.watch('gross_kg');
  const tare = form.watch('tare_kg');
  const netPreview = D(gross || '0').minus(D(tare || '0'));

  // ── Auto-Save Draft ke LocalStorage ────────────────────────────────────────
  const saveDraft = useCallback(
    (values: Partial<HarvestReceiptForm>) => {
      try {
        const draft = { ...values, savedAt: new Date().toISOString(), requestId };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        setDraftSavedAt(draft.savedAt);
      } catch {
        // localStorage penuh atau private mode — abaikan
      }
    },
    [requestId]
  );

  // Simpan draft tiap 15 detik atau saat nilai berubah
  useEffect(() => {
    const values = form.getValues();
    const timer = setTimeout(() => saveDraft(values), 15_000);
    return () => clearTimeout(timer);
  }, [form.watch(), saveDraft]);

  // Muat draft saat halaman dibuka
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft && draft.gross_kg) {
        form.reset({
          member_code: draft.member_code || '',
          product_id: draft.product_id || 1,
          warehouse_id: draft.warehouse_id || 1,
          gross_kg: draft.gross_kg || '',
          tare_kg: draft.tare_kg || '0',
          moisture_pct: draft.moisture_pct || '',
          notes: draft.notes || '',
        });
        setDraftSavedAt(draft.savedAt);
        toast.info('Draft setoran sebelumnya berhasil dipulihkan.');
      }
    } catch {
      // abaikan
    }
  }, []);

  // ── Barcode Wedge: scan kode anggota ───────────────────────────────────────
  useBarcodeWedge((scanned) => {
    if (scanned.startsWith('AGT-')) {
      form.setValue('member_code', scanned, { shouldValidate: true });
      setMemberSearch(scanned);
      toast.success(`Anggota dipindai: ${scanned}`);
    }
  });

  // ── Keyboard Shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // F2 → Ambil berat dari timbangan
      if (e.key === 'F2' && scale.kg) {
        e.preventDefault();
        form.setValue('gross_kg', scale.kg, { shouldValidate: true });
        toast.success(`Berat diambil: ${fmtKg(scale.kg)}`);
      }
      // F3 → Ambil tara dari timbangan
      if (e.key === 'F3' && scale.kg) {
        e.preventDefault();
        form.setValue('tare_kg', scale.kg, { shouldValidate: true });
        toast.info(`Tara diambil: ${fmtKg(scale.kg)}`);
      }
      // Ctrl+S → Simpan draft manual
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveDraft(form.getValues());
        toast.success('Draft disimpan!');
      }
      // Ctrl+Enter → Submit form
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        form.handleSubmit(onSave)();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [scale.kg]);

  const selectedMember = members.find((m) => m.code === form.watch('member_code'));

  // ── Submit ──────────────────────────────────────────────────────────────────
  const onSave = async (v: HarvestReceiptForm) => {
    try {
      const payload = {
        client_request_id: requestId,
        member_code: v.member_code,
        product_id: v.product_id,
        warehouse_id: v.warehouse_id,
        gross_kg: v.gross_kg,
        tare_kg: v.tare_kg,
        moisture_pct: v.moisture_pct || null,
        notes: v.notes || null,
      };

      const res = await api<HarvestResult>('/procurement/harvest-receipts', {
        method: 'POST',
        json: payload,
      });

      // Hapus draft setelah berhasil simpan
      localStorage.removeItem(DRAFT_KEY);
      setResult(res);
      toast.success(`Setoran tersimpan! Batch: ${res.batch_code}`);
    } catch (err) {
      if (err instanceof ApiError && err.isNetwork) {
        // Offline → antri di IndexedDB
        await outbox.enqueue({
          id: requestId,
          kind: 'harvest-receipt',
          payload: { ...v, client_request_id: requestId },
        });
        setResult({
          receipt_no: `STR-OFF-${requestId.slice(0, 8).toUpperCase()}`,
          batch_code: `BATCH-OFFLINE-${requestId.slice(0, 6).toUpperCase()}`,
          received_at: new Date().toISOString(),
          gross_kg: v.gross_kg,
          tare_kg: v.tare_kg,
          net_kg: netPreview.toString(),
          queued: true,
        });
        toast.info('Data aman di antrean lokal. Akan dikirim saat online.');
      } else if (err instanceof ApiError) {
        toast.error(messageFor(err.code, err.message));
      } else {
        toast.error('Terjadi kesalahan. Silakan coba lagi.');
      }
    }
  };

  const resetForm = () => {
    setResult(null);
    setRequestId(crypto.randomUUID());
    setMemberSearch('');
    setDraftSavedAt(null);
    form.reset({
      member_code: '',
      product_id: 1,
      warehouse_id: 1,
      gross_kg: '',
      tare_kg: '0',
      moisture_pct: '',
      notes: '',
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: Tampilan Sukses
  // ═══════════════════════════════════════════════════════════════════════════
  if (result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
        <div className="rounded-panel border border-line bg-surface p-8 shadow-md text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-green-50 text-green-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-ink-900">
              {result.queued
                ? '✅ Setoran Disimpan di Antrean Lokal'
                : '✅ Setoran Panen Berhasil Diterima!'}
            </h2>
            <p className="text-sm text-ink-600 mt-1">
              {result.queued
                ? 'Nomor batch resmi akan diterbitkan otomatis setelah kembali online.'
                : 'Nomor batch resmi telah diterbitkan oleh sistem.'}
            </p>
          </div>

          <div className="p-5 rounded-control bg-navy-50/70 border border-line space-y-2">
            <p className="text-xs uppercase font-bold tracking-wider text-ink-600">
              Nomor Batch Pelacakan
            </p>
            <p className="text-3xl font-extrabold text-navy-800 tracking-wide font-mono">
              {result.batch_code}
            </p>
            <div className="flex justify-center gap-6 text-sm text-ink-900 pt-2 border-t border-navy-500/20">
              <span>
                Berat Bersih: <b>{fmtKg(result.net_kg)}</b>
              </span>
              <span>
                Anggota: <b>{selectedMember?.name ?? result.receipt_no}</b>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button variant="primary" size="lg" onClick={() => window.print()} className="gap-2">
              <Printer className="w-5 h-5" />
              Cetak Nota Timbang
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
              Timbang Setoran Berikutnya
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: Form Utama
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-6xl w-full mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
            <PackageCheck className="w-6 h-6 text-navy-700" />
            Pencatatan Setoran Panen
          </h1>
          <p className="text-xs text-ink-600 mt-0.5">
            F2 = Ambil berat kotor · F3 = Ambil tara · Ctrl+S = Simpan draft · Ctrl+Enter = Simpan
          </p>
        </div>
        <DraftBadge savedAt={draftSavedAt} />
      </div>

      {/* Banner Offline */}
      <OfflineBanner show={!online} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Kolom Kiri: Anggota & Komoditas ─────────────────────────── */}
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
                placeholder="Ketik nama, kode AGT, atau scan barcode..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="pl-9"
              />
              <Search className="w-4 h-4 text-ink-600 absolute left-3 top-3 pointer-events-none" />
            </div>

            <Select
              options={members
                .filter(
                  (m) =>
                    memberSearch === '' ||
                    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
                    m.code.includes(memberSearch.toUpperCase())
                )
                .map((m) => ({
                  value: m.code,
                  label: `${m.code} — ${m.name} (${m.commodity})`,
                }))}
              value={form.watch('member_code')}
              onChange={(e) => {
                form.setValue('member_code', e.target.value, { shouldValidate: true });
              }}
            />
            {form.formState.errors.member_code && (
              <p className="text-xs text-coral-700 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {form.formState.errors.member_code.message}
              </p>
            )}

            {selectedMember && (
              <div className="p-3.5 rounded-control bg-canvas border border-line text-xs space-y-1">
                <div className="flex justify-between font-semibold text-ink-900">
                  <span>{selectedMember.name}</span>
                  <span
                    className={
                      selectedMember.status === 'AKTIF' ? 'text-green-700' : 'text-coral-700'
                    }
                  >
                    {selectedMember.status}
                  </span>
                </div>
                <p className="text-ink-600">
                  Lahan: {selectedMember.land} · Komoditas: {selectedMember.commodity}
                </p>
              </div>
            )}
          </div>

          {/* Komoditas & Gudang */}
          <div className="rounded-panel border border-line bg-surface p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-ink-900">2. Komoditas & Gudang Tujuan</h3>

            <div>
              <label className="block text-xs font-semibold text-ink-900 mb-1">
                Komoditas Panen
              </label>
              <Select
                options={products.map((p) => ({ value: p.id, label: p.name }))}
                value={form.watch('product_id')}
                onChange={(e) =>
                  form.setValue('product_id', Number(e.target.value), { shouldValidate: true })
                }
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-900 mb-1">
                Gudang Penerimaan
              </label>
              <Select
                options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
                value={form.watch('warehouse_id')}
                onChange={(e) =>
                  form.setValue('warehouse_id', Number(e.target.value), { shouldValidate: true })
                }
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-900 mb-1">
                Catatan Tambahan <span className="text-ink-600 font-normal">— Opsional</span>
              </label>
              <Input
                placeholder="Kondisi fisik, catatan khusus petani..."
                {...form.register('notes')}
              />
            </div>
          </div>
        </div>

        {/* ── Kolom Kanan: Timbangan & Validasi ───────────────────────── */}
        <div className="lg:col-span-7 space-y-5">
          {/* Readout Timbangan */}
          <ScaleReadout kg={scale.kg || gross} stable={scale.stable} status={scale.status} />

          {/* Tombol koneksi timbangan jika belum tersambung */}
          {scale.status === 'idle' && (
            <div className="rounded-panel border border-dashed border-amber-300 bg-amber-50 p-4 text-center space-y-2">
              <p className="text-sm font-semibold text-amber-800">
                Timbangan digital belum tersambung
              </p>
              <Button variant="outline" size="md" onClick={scale.connect} className="gap-2">
                <ScaleIcon className="w-4 h-4" />
                Sambungkan Timbangan (Web Serial)
              </Button>
            </div>
          )}

          {/* Panel Input Berat */}
          <div className="rounded-panel border border-line bg-surface p-6 shadow-sm space-y-5">
            {/* Tombol Ambil Berat — touch-friendly, besar */}
            <Button
              type="button"
              variant="primary"
              size="lg"
              disabled={!scale.kg}
              onClick={() => {
                if (scale.kg) {
                  form.setValue('gross_kg', scale.kg, { shouldValidate: true });
                  toast.success(`Berat kotor diambil: ${fmtKg(scale.kg)}`);
                }
              }}
              className="w-full h-16 text-lg gap-3 font-bold shadow-md"
              aria-label="Ambil berat kotor dari timbangan digital (F2)"
            >
              <ScaleIcon className="w-6 h-6" />
              Ambil Berat Kotor (F2)
            </Button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Berat Kotor */}
              <div>
                <label className="block text-xs font-semibold text-ink-900 mb-1">
                  Berat Kotor (Gross)
                </label>
                <NumberInput
                  value={form.watch('gross_kg')}
                  onChange={(v) => form.setValue('gross_kg', v, { shouldValidate: true })}
                  unit="kg"
                  placeholder="0,00"
                  invalid={!!form.formState.errors.gross_kg}
                />
                {form.formState.errors.gross_kg && (
                  <p className="text-xs text-coral-700 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {form.formState.errors.gross_kg.message}
                  </p>
                )}
              </div>

              {/* Tara */}
              <div>
                <label className="block text-xs font-semibold text-ink-900 mb-1">
                  Tara Keranjang / Peti
                </label>
                <div className="flex gap-2">
                  <NumberInput
                    value={form.watch('tare_kg')}
                    onChange={(v) => form.setValue('tare_kg', v, { shouldValidate: true })}
                    unit="kg"
                    placeholder="0,00"
                    invalid={!!form.formState.errors.tare_kg}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={() => {
                      if (scale.kg) {
                        form.setValue('tare_kg', scale.kg, { shouldValidate: true });
                        toast.info(`Tara diambil: ${fmtKg(scale.kg)}`);
                      }
                    }}
                    title="Ambil tara dari timbangan (F3)"
                  >
                    Tara
                  </Button>
                </div>
                {form.formState.errors.tare_kg && (
                  <p className="text-xs text-coral-700 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {form.formState.errors.tare_kg.message}
                  </p>
                )}
              </div>
            </div>

            {/* Kadar Air */}
            <div>
              <label className="block text-xs font-semibold text-ink-900 mb-1">
                Kadar Air (%) <span className="text-ink-600 font-normal">— Opsional</span>
              </label>
              <NumberInput
                value={form.watch('moisture_pct') || ''}
                onChange={(v) => form.setValue('moisture_pct', v)}
                unit="%"
                placeholder="0,00"
                maxDp={2}
              />
            </div>

            {/* Preview Berat Bersih */}
            <div className="p-4 rounded-control bg-canvas border border-line flex items-center justify-between">
              <div>
                <p className="text-xs text-ink-600 uppercase font-bold tracking-wider">
                  Perkiraan Berat Bersih (Netto)
                </p>
                <p className="text-[11px] text-ink-600">Berat kotor dikurangi tara keranjang</p>
              </div>
              <p className="text-3xl font-extrabold text-navy-800">
                {fmtKg(netPreview.isNegative() ? '0' : netPreview.toString())}
              </p>
            </div>

            {/* Tombol Simpan */}
            <Button
              type="button"
              variant="primary"
              size="lg"
              loading={form.formState.isSubmitting}
              onClick={form.handleSubmit(onSave)}
              className="w-full h-14 text-base font-bold shadow-md gap-2"
              aria-label="Simpan setoran panen (Ctrl+Enter)"
            >
              <CheckCircle2 className="w-5 h-5" />
              Simpan Setoran Panen (Ctrl + Enter)
            </Button>

            {/* Tombol Simpan Draft Manual */}
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => {
                saveDraft(form.getValues());
                toast.success('Draft berhasil disimpan ke perangkat.');
              }}
              className="w-full gap-2"
            >
              <Save className="w-4 h-4" />
              Simpan Draft (Ctrl + S)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
