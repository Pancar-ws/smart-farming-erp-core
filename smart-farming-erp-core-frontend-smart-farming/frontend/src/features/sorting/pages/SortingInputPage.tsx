// src/features/sorting/pages/SortingInputPage.tsx
// CACA - Modul Manufacturing & Sortasi (Fitur 4)
// Tabel input grading mutu + Real-Time Mass Balance Calculator (indikator warna)
// + Notifikasi kontekstual + Auto-Save Draft LocalStorage

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/core/api/client';
import { D, sum, fmtIdr, fmtKg, fmtPct } from '@/core/format/money';
import { massBalance } from '@/features/sorting/massBalance';
import { Button } from '@/components/ui/Button';
import { NumberInput } from '@/components/ui/NumberInput';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  Save,
  Info,
  PackageSearch,
  Scale,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Konstanta ────────────────────────────────────────────────────────────────
const SORTING_DRAFT_KEY = 'sorting_input_draft';
const ROP_THRESHOLD_KG = 50; // Reorder Point: peringatan jika stok afkir > threshold

// ─── Types ────────────────────────────────────────────────────────────────────
interface GradeRow {
  grade_id: number;
  grade_code: string;
  grade_name: string;
  is_reject: boolean;
  qty_kg: string;
  purchase_price: string;
  min_stock_kg?: number; // threshold Restock Warning
}

interface BatchInput {
  batch_code: string;
  input_kg: string;
  member_name: string;
  commodity: string;
}

// ─── Komponen: Indikator Neraca Massa (Mass Balance) ─────────────────────────
function MassBalanceIndicator({
  inputKg,
  outputs,
  rejectQty,
}: {
  inputKg: string;
  outputs: string[];
  rejectQty: string;
}) {
  const mb = massBalance(inputKg, outputs, rejectQty);

  const colorClass =
    mb.state === 'balanced'
      ? 'bg-green-50 border-green-200 text-green-800'
      : mb.state === 'short'
      ? 'bg-amber-50 border-amber-200 text-amber-800'
      : 'bg-coral-50 border-coral-200 text-coral-700';

  const Icon =
    mb.state === 'balanced'
      ? CheckCircle2
      : mb.state === 'short'
      ? AlertTriangle
      : XCircle;

  const message =
    mb.state === 'balanced'
      ? '✅ Neraca massa seimbang — Input = Output'
      : mb.state === 'short'
      ? `⚠️ Kurang ${fmtKg(mb.diff.toString())} — isi sisa atau catat ke Afkir`
      : `❌ Output melebihi input sebesar ${fmtKg(mb.diff.abs().toString())}`;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`p-4 rounded-control flex flex-col sm:flex-row items-start sm:items-center justify-between border gap-3 transition-colors duration-300 ${colorClass}`}
    >
      <div className="flex items-start sm:items-center gap-2 font-semibold text-sm">
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5 sm:mt-0" />
        <div>
          <span>{message}</span>
          <div className="flex gap-4 text-xs font-normal mt-1 opacity-75">
            <span>Input: <b>{fmtKg(inputKg)}</b></span>
            <span>Output: <b>{fmtKg(mb.out.toString())}</b></span>
          </div>
        </div>
      </div>
      <div className="text-right text-xs font-semibold shrink-0">
        <p className="opacity-70">Tingkat Susut (Afkir)</p>
        <p className="text-base font-bold">{fmtPct(mb.shrinkPct.toString())}</p>
      </div>
    </div>
  );
}

// ─── Komponen: Banner Peringatan Restock ──────────────────────────────────────
function RestockWarningBanner({
  grades,
}: {
  grades: GradeRow[];
}) {
  const lowStockGrades = grades.filter(
    (g) => g.min_stock_kg !== undefined && D(g.qty_kg).lt(g.min_stock_kg)
  );

  if (lowStockGrades.length === 0) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 px-4 py-3 rounded-panel bg-amber-50 border border-amber-300 text-amber-800 text-sm"
    >
      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
      <div>
        <p className="font-bold">⚠️ Peringatan Stok Minimum Terlampaui</p>
        <ul className="mt-1 list-disc list-inside text-xs space-y-0.5">
          {lowStockGrades.map((g) => (
            <li key={g.grade_id}>
              <b>{g.grade_name}</b>: input {fmtKg(g.qty_kg)} di bawah minimum{' '}
              {fmtKg(String(g.min_stock_kg))}. Pertimbangkan restock segera.
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Komponen: Badge Draft ─────────────────────────────────────────────────────
function DraftBadge({ savedAt }: { savedAt: string | null }) {
  if (!savedAt) return null;
  const time = new Date(savedAt).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-600 bg-canvas border border-line px-2.5 py-1 rounded-full">
      <Save className="w-3.5 h-3.5" />
      Draft disimpan {time}
    </span>
  );
}

// ─── Main Page Component ───────────────────────────────────────────────────────
export default function SortingInputPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  // Data batch (normalnya dari URL params / API)
  const batch: BatchInput = {
    batch_code: 'BATCH-20261114-001',
    input_kg: '1000.00',
    member_name: 'Budi Santoso',
    commodity: 'Cabai Merah Keriting',
  };

  const [grades, setGrades] = useState<GradeRow[]>([
    {
      grade_id: 1,
      grade_code: 'A',
      grade_name: 'Grade A (Super)',
      is_reject: false,
      qty_kg: '',
      purchase_price: '38000',
      min_stock_kg: 100,
    },
    {
      grade_id: 2,
      grade_code: 'B',
      grade_name: 'Grade B (Medium)',
      is_reject: false,
      qty_kg: '',
      purchase_price: '30000',
      min_stock_kg: 50,
    },
    {
      grade_id: 3,
      grade_code: 'C',
      grade_name: 'Grade C (Rendah)',
      is_reject: false,
      qty_kg: '',
      purchase_price: '20000',
    },
    {
      grade_id: 4,
      grade_code: 'AFKIR',
      grade_name: 'Afkir (Limbah/Rusak)',
      is_reject: true,
      qty_kg: '',
      purchase_price: '0',
    },
  ]);

  const [qcStatus, setQcStatus] = useState<'PASS' | 'FAIL'>('PASS');
  const [qcNotes, setQcNotes] = useState('');

  // ── Auto-Save Draft ─────────────────────────────────────────────────────────
  const saveDraft = useCallback(() => {
    try {
      const draft = {
        grades,
        qcStatus,
        qcNotes,
        batch_code: batch.batch_code,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(SORTING_DRAFT_KEY, JSON.stringify(draft));
      setDraftSavedAt(draft.savedAt);
    } catch {
      // abaikan
    }
  }, [grades, qcStatus, qcNotes]);

  // Auto-save tiap 20 detik
  useEffect(() => {
    const timer = setInterval(saveDraft, 20_000);
    return () => clearInterval(timer);
  }, [saveDraft]);

  // Muat draft saat halaman dibuka
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SORTING_DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft && draft.batch_code === batch.batch_code && draft.grades) {
        setGrades(draft.grades);
        setQcStatus(draft.qcStatus || 'PASS');
        setQcNotes(draft.qcNotes || '');
        setDraftSavedAt(draft.savedAt);
        toast.info('Draft sortasi sebelumnya berhasil dipulihkan.');
      }
    } catch {
      // abaikan
    }
  }, []);

  // ── Keyboard Shortcut Ctrl+S ────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveDraft();
        toast.success('Draft sortasi disimpan!');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saveDraft]);

  // ── Computed ────────────────────────────────────────────────────────────────
  const outputs = grades.map((g) => g.qty_kg || '0');
  const rejectQty = grades.find((g) => g.is_reject)?.qty_kg || '0';
  const mb = massBalance(batch.input_kg, outputs, rejectQty);

  const estimatedPayable = grades.reduce(
    (acc, g) => acc.plus(D(g.qty_kg || '0').times(D(g.purchase_price))),
    D(0)
  );

  // ── Handler ─────────────────────────────────────────────────────────────────
  const updateQty = (idx: number, val: string) => {
    setGrades((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], qty_kg: val };
      return copy;
    });
  };

  const fillRemainderToReject = () => {
    if (mb.diff.gt(0)) {
      setGrades((prev) =>
        prev.map((g) => {
          if (g.is_reject) {
            const current = D(g.qty_kg || '0');
            const filled = current.plus(mb.diff).toFixed(2);
            toast.info(`Sisa ${fmtKg(mb.diff.toString())} ditambahkan ke Afkir.`);
            return { ...g, qty_kg: filled };
          }
          return g;
        })
      );
    }
  };

  const handlePost = async () => {
    if (mb.state !== 'balanced') {
      toast.error('Neraca massa belum seimbang. Periksa kembali alokasi grade.');
      return;
    }

    setSubmitting(true);
    try {
      await api('/manufacturing/sorting-orders', {
        method: 'POST',
        json: {
          batch_inputs: [{ batch_code: batch.batch_code, input_kg: batch.input_kg }],
          outputs: grades.map((g) => ({ grade_id: g.grade_id, output_kg: g.qty_kg })),
          qc: { status: qcStatus, notes: qcNotes },
        },
      });

      localStorage.removeItem(SORTING_DRAFT_KEY);
      toast.success('Order sortasi berhasil diposting! Stok barang jadi telah diperbarui.');
      navigate('/sortasi');
    } catch (err: any) {
      toast.error(err.message || 'Gagal memposting sortasi. Periksa koneksi dan coba lagi.');
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/sortasi')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-ink-900">Input Sortasi & Grading Mutu</h1>
            <p className="text-xs text-ink-600">
              Real-time Mass Balance Calculator · Ctrl+S = Simpan draft
            </p>
          </div>
        </div>
        <DraftBadge savedAt={draftSavedAt} />
      </div>

      {/* Banner Peringatan Restock */}
      <RestockWarningBanner grades={grades} />

      {/* Kartu Info Batch */}
      <div className="rounded-panel border border-line bg-surface p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-line gap-2">
          <div>
            <span className="text-xs font-bold text-navy-700 uppercase tracking-wider">
              Batch Masuk Terpilih
            </span>
            <p className="font-mono font-bold text-lg text-ink-900">{batch.batch_code}</p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-ink-600">Total Input Mentah:</span>
            <p className="text-xl font-bold text-ink-900">{fmtKg(batch.input_kg)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-ink-600">Petani:</span>
            <p className="font-semibold text-ink-900">{batch.member_name}</p>
          </div>
          <div>
            <span className="text-ink-600">Komoditas:</span>
            <p className="font-semibold text-ink-900">{batch.commodity}</p>
          </div>
          <div>
            <span className="text-ink-600">Status:</span>
            <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-navy-50 text-navy-700 font-semibold">
              Menunggu Sortasi
            </span>
          </div>
        </div>
      </div>

      {/* Tabel Alokasi Grade */}
      <div className="rounded-panel border border-line bg-surface p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base text-ink-900">
            <PackageSearch className="w-5 h-5 inline mr-2 text-navy-700" />
            Alokasi Hasil Pemilahan Grade
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={fillRemainderToReject}
            disabled={!mb.diff.gt(0)}
            className="text-xs"
          >
            Isi Sisa {mb.diff.gt(0) ? `(${fmtKg(mb.diff.toString())})` : ''} → Afkir
          </Button>
        </div>

        {/* Petunjuk penggunaan */}
        <div className="flex items-start gap-2 text-xs text-ink-600 bg-canvas border border-line rounded-control p-3">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>
            Isi berat (kg) setiap grade hasil sortasi. Indikator neraca massa akan berubah warna
            secara real-time. Tombol posting aktif hanya saat neraca <b>seimbang</b> dan QC{' '}
            <b>Lolos</b>.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-line text-xs font-semibold uppercase text-ink-600">
                <th className="py-2.5">Grade</th>
                <th className="py-2.5 w-44 text-right">Jumlah (kg)</th>
                <th className="py-2.5 text-right hidden sm:table-cell">Harga Beli/kg</th>
                <th className="py-2.5 text-right hidden sm:table-cell">Nilai Pembelian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {grades.map((g, idx) => {
                const rowValue = D(g.qty_kg || '0').times(D(g.purchase_price));
                const isLowStock =
                  g.min_stock_kg !== undefined &&
                  D(g.qty_kg || '0').gt(0) &&
                  D(g.qty_kg || '0').lt(g.min_stock_kg);

                return (
                  <tr key={g.grade_id} className="h-16">
                    <td className="py-2 font-medium">
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            g.is_reject
                              ? 'text-coral-700 font-bold'
                              : 'text-ink-900'
                          }
                        >
                          {g.grade_name}
                        </span>
                        {isLowStock && (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                            RESTOCK
                          </span>
                        )}
                      </div>
                      {g.min_stock_kg && (
                        <span className="text-[10px] text-ink-500">
                          Min. stok: {fmtKg(String(g.min_stock_kg))}
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      <NumberInput
                        value={g.qty_kg}
                        onChange={(v) => updateQty(idx, v)}
                        unit="kg"
                        placeholder="0,00"
                        className="max-w-[150px] ml-auto"
                        aria-label={`Jumlah ${g.grade_name} dalam kg`}
                      />
                    </td>
                    <td className="py-2 text-right font-mono text-ink-600 hidden sm:table-cell">
                      {g.is_reject ? (
                        <span className="text-ink-400 italic">—</span>
                      ) : (
                        fmtIdr(g.purchase_price)
                      )}
                    </td>
                    <td className="py-2 text-right font-mono font-semibold text-ink-900 hidden sm:table-cell">
                      {g.is_reject ? (
                        <span className="text-ink-400 italic">—</span>
                      ) : (
                        fmtIdr(rowValue.toString())
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Footer Total */}
            <tfoot>
              <tr className="border-t-2 border-line font-bold bg-canvas">
                <td className="py-3 text-xs uppercase tracking-wide text-ink-600">
                  Total Output
                </td>
                <td className="py-3 text-right font-bold text-ink-900">
                  {fmtKg(mb.out.toString())}
                </td>
                <td className="py-3 hidden sm:table-cell" />
                <td className="py-3 text-right hidden sm:table-cell font-bold text-navy-800">
                  {fmtIdr(estimatedPayable.toString())}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Indikator Neraca Massa Real-Time */}
        <MassBalanceIndicator
          inputKg={batch.input_kg}
          outputs={outputs}
          rejectQty={rejectQty}
        />

        {/* QC Section */}
        <div className="pt-4 border-t border-line grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink-900 mb-2">
              Status Pemeriksaan Mutu (QC)
            </label>
            <div className="flex gap-4">
              <label className="inline-flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input
                  type="radio"
                  name="qc_status"
                  value="PASS"
                  checked={qcStatus === 'PASS'}
                  onChange={() => setQcStatus('PASS')}
                  className="w-4 h-4 text-navy-700"
                />
                <span className="text-green-700 font-bold">✅ Lolos QC</span>
              </label>
              <label className="inline-flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input
                  type="radio"
                  name="qc_status"
                  value="FAIL"
                  checked={qcStatus === 'FAIL'}
                  onChange={() => {
                    setQcStatus('FAIL');
                    toast.warning(
                      'QC tidak lolos dicatat. Sortasi tidak dapat diposting sampai masalah diselesaikan.'
                    );
                  }}
                  className="w-4 h-4 text-coral-700"
                />
                <span className="text-coral-700 font-bold">❌ Tidak Lolos</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-900 mb-1">
              Catatan Petugas Sortasi / QC
            </label>
            <input
              type="text"
              value={qcNotes}
              onChange={(e) => setQcNotes(e.target.value)}
              placeholder="Kondisi fisik komoditas, catatan khusus..."
              className="w-full h-10 px-3 bg-white text-ink-900 border border-line rounded-control text-sm outline-none focus:border-navy-700"
              aria-label="Catatan QC"
            />
          </div>
        </div>

        {/* Error Kontekstual jika neraca tidak seimbang atau QC gagal */}
        {mb.state !== 'balanced' && (
          <div
            role="alert"
            className="flex items-start gap-2 text-xs text-coral-700 bg-coral-50 border border-coral-200 rounded-control p-3"
          >
            <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              <b>Posting diblokir:</b> Neraca massa belum seimbang. Jumlah output harus sama persis
              dengan input batch ({fmtKg(batch.input_kg)}).
            </span>
          </div>
        )}

        {qcStatus === 'FAIL' && (
          <div
            role="alert"
            className="flex items-start gap-2 text-xs text-coral-700 bg-coral-50 border border-coral-200 rounded-control p-3"
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              <b>Posting diblokir:</b> Status QC tidak lolos. Perbaiki kondisi komoditas atau
              perbarui status QC sebelum posting.
            </span>
          </div>
        )}

        {/* Ringkasan & Tombol Aksi */}
        <div className="pt-4 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs text-ink-600">Perkiraan Hutang Pembelian ke Petani:</p>
            <p className="text-2xl font-bold text-navy-800">
              {fmtIdr(estimatedPayable.toString())}
            </p>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            {/* Simpan Draft */}
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                saveDraft();
                toast.success('Draft sortasi disimpan ke perangkat.');
              }}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Draft
            </Button>

            {/* Posting */}
            <Button
              variant="primary"
              size="lg"
              disabled={mb.state !== 'balanced' || qcStatus !== 'PASS'}
              onClick={() => setConfirmOpen(true)}
              className="font-bold gap-2 flex-1 sm:flex-none"
              aria-label="Posting hasil sortasi"
            >
              <CheckCircle2 className="w-5 h-5" />
              Posting Sortasi
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog Konfirmasi */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Posting Hasil Sortasi?"
        description={`Setelah diposting, sortasi tidak dapat dihapus atau diubah. Stok barang jadi per grade dan kewajiban hutang ke ${batch.member_name} sebesar ${fmtIdr(estimatedPayable.toString())} akan terbentuk secara otomatis di buku besar.`}
        confirmLabel="Ya, Posting Sekarang"
        variant="primary"
        loading={submitting}
        onConfirm={handlePost}
      />
    </div>
  );
}
