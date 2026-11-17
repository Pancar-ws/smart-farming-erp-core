// src/features/sorting/pages/SortingFormPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/core/api/client';
import { D, sum, fmtIdr, fmtKg, fmtPct } from '@/core/format/money';
import { massBalance } from '@/features/sorting/massBalance';
import { Button } from '@/components/ui/Button';
import { NumberInput } from '@/components/ui/NumberInput';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { CheckCircle2, AlertTriangle, XCircle, ArrowLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface GradeRow {
  grade_id: number;
  grade_code: string;
  grade_name: string;
  is_reject: boolean;
  qty_kg: string;
  purchase_price: string;
}

export default function SortingFormPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Skenario UAT Cabai 1.000 kg input
  const inputKg = '1000.00';
  const batchCode = 'BATCH-20261114-001';
  const memberName = 'Budi Santoso';
  const commodity = 'Cabai Merah Keriting';

  const [grades, setGrades] = useState<GradeRow[]>([
    { grade_id: 1, grade_code: 'A', grade_name: 'Grade A (Super)', is_reject: false, qty_kg: '700.00', purchase_price: '38000' },
    { grade_id: 2, grade_code: 'B', grade_name: 'Grade B (Medium)', is_reject: false, qty_kg: '200.00', purchase_price: '30000' },
    { grade_id: 3, grade_code: 'AFKIR', grade_name: 'Afkir (Limbah/Rusak)', is_reject: true, qty_kg: '100.00', purchase_price: '0' },
  ]);

  const [qcStatus, setQcStatus] = useState<'PASS' | 'FAIL'>('PASS');
  const [qcNotes, setQcNotes] = useState('Kualitas cabai segar, tingkat kematangan 90%');

  const updateQty = (idx: number, val: string) => {
    setGrades((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], qty_kg: val };
      return copy;
    });
  };

  const outputs = grades.map((g) => g.qty_kg);
  const rejectQty = grades.find((g) => g.is_reject)?.qty_kg || '0';
  const mb = massBalance(inputKg, outputs, rejectQty);

  // Hitung perkiraan hutang anggota: Σ (qty * harga)
  const estimatedPayable = grades.reduce(
    (acc, g) => acc.plus(D(g.qty_kg).times(D(g.purchase_price))),
    D(0)
  );

  const fillRemainderToReject = () => {
    if (mb.diff.gt(0)) {
      setGrades((prev) =>
        prev.map((g) => {
          if (g.is_reject) {
            const current = D(g.qty_kg);
            return { ...g, qty_kg: current.plus(mb.diff).toFixed(2) };
          }
          return g;
        })
      );
    }
  };

  const handlePost = async () => {
    setSubmitting(true);
    try {
      await api('/manufacturing/sorting-orders', {
        method: 'POST',
        json: {
          batch_inputs: [{ batch_code: batchCode, input_kg: inputKg }],
          outputs: grades.map((g) => ({
            grade_id: g.grade_id,
            output_kg: g.qty_kg,
          })),
          qc: {
            status: qcStatus,
            notes: qcNotes,
          },
        },
      });

      toast.success('Order sortasi berhasil diposting!');
      navigate('/sortasi');
    } catch (err: any) {
      toast.error(err.message || 'Gagal memposting sortasi');
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/sortasi')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Kembali
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Order Sortasi Panen Baru</h1>
          <p className="text-xs text-ink-600">
            Pemilahan grade komoditas dengan penegakan neraca massa kekekalan input vs output.
          </p>
        </div>
      </div>

      {/* Kartu Input Batch */}
      <div className="rounded-panel border border-line bg-surface p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-line gap-2">
          <div>
            <span className="text-xs font-bold text-navy-700 uppercase tracking-wider">
              Batch Masuk Terpilih
            </span>
            <p className="font-mono font-bold text-lg text-ink-900">{batchCode}</p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-ink-600">Total Input Mentah:</span>
            <p className="readout text-xl font-bold text-ink-900">{fmtKg(inputKg)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-ink-600">Petani:</span>
            <p className="font-semibold text-ink-900">{memberName}</p>
          </div>
          <div>
            <span className="text-ink-600">Komoditas:</span>
            <p className="font-semibold text-ink-900">{commodity}</p>
          </div>
          <div>
            <span className="text-ink-600">Status Awal:</span>
            <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-navy-50 text-navy-700 font-semibold">
              Menunggu Sortasi
            </span>
          </div>
        </div>
      </div>

      {/* Tabel Pemilahan Grade Output */}
      <div className="rounded-panel border border-line bg-surface p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base text-ink-900">Alokasi Hasil Pemilahan Grade</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={fillRemainderToReject}
            disabled={!mb.diff.gt(0)}
            className="text-xs"
          >
            Isi Sisa ke Afkir ({fmtKg(mb.diff.gt(0) ? mb.diff.toString() : '0')})
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-line text-xs font-semibold uppercase text-ink-600">
                <th className="py-2.5">Grade</th>
                <th className="py-2.5 w-40 text-right">Jumlah (kg)</th>
                <th className="py-2.5 text-right">Harga Beli/kg</th>
                <th className="py-2.5 text-right">Nilai Pembelian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {grades.map((g, idx) => {
                const rowValue = D(g.qty_kg).times(D(g.purchase_price));
                return (
                  <tr key={g.grade_id} className="h-14">
                    <td className="py-2 font-medium">
                      <span className={g.is_reject ? 'text-coral-700 font-bold' : 'text-ink-900'}>
                        {g.grade_name}
                      </span>
                    </td>
                    <td className="py-2 text-right">
                      <NumberInput
                        value={g.qty_kg}
                        onChange={(v) => updateQty(idx, v)}
                        unit="kg"
                        placeholder="0,00"
                        className="max-w-[150px] ml-auto"
                      />
                    </td>
                    <td className="py-2 text-right font-mono text-ink-600">
                      {fmtIdr(g.purchase_price)}
                    </td>
                    <td className="py-2 text-right font-mono font-semibold text-ink-900">
                      {fmtIdr(rowValue.toString())}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Indikator Neraca Massa */}
        <div
          role="status"
          className={`p-4 rounded-control flex items-center justify-between border ${
            mb.state === 'balanced'
              ? 'bg-green-50 border-green-200 text-green-700'
              : mb.state === 'short'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-coral-50 border-coral-200 text-coral-700'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold text-sm">
            {mb.state === 'balanced' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : mb.state === 'short' ? (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            ) : (
              <XCircle className="w-5 h-5 text-coral-700" />
            )}
            <span>
              {mb.state === 'balanced'
                ? 'Neraca massa seimbang (Input = Output)'
                : mb.state === 'short'
                ? `Kurang ${fmtKg(mb.diff.toString())} — isi atau catat sebagai afkir`
                : `Melebihi input ${fmtKg(mb.diff.abs().toString())}`}
            </span>
          </div>

          <div className="text-right text-xs font-semibold">
            <span>Tingkat Susut: </span>
            <span className="font-bold">{fmtPct(mb.shrinkPct.toString())}</span>
          </div>
        </div>

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
                <span className="text-green-700 font-bold">Lolos QC</span>
              </label>
              <label className="inline-flex items-center gap-2 text-sm font-medium cursor-pointer">
                <input
                  type="radio"
                  name="qc_status"
                  value="FAIL"
                  checked={qcStatus === 'FAIL'}
                  onChange={() => setQcStatus('FAIL')}
                  className="w-4 h-4 text-coral-700"
                />
                <span className="text-coral-700 font-bold">Tidak Lolos</span>
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
              placeholder="Kondisi fisik komoditas..."
              className="w-full h-control px-3 bg-white text-ink-900 border border-line rounded-control text-sm outline-none focus:border-navy-700"
            />
          </div>
        </div>

        {/* Ringkasan & Posting */}
        <div className="pt-4 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs text-ink-600">Perkiraan Hutang Pembelian ke Petani:</p>
            <p className="readout text-2xl font-bold text-navy-800">
              {fmtIdr(estimatedPayable.toString())}
            </p>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              disabled={mb.state !== 'balanced' || qcStatus !== 'PASS'}
              onClick={() => setConfirmOpen(true)}
              className="w-full sm:w-auto font-bold gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Posting Sortasi
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Posting Hasil Sortasi?"
        description="Setelah diposting, sortasi tidak dapat dihapus. Stok barang jadi per grade dan kewajiban hutang ke petani akan terbentuk secara otomatis di buku besar."
        confirmLabel="Posting Sortasi"
        variant="primary"
        loading={submitting}
        onConfirm={handlePost}
      />
    </div>
  );
}

