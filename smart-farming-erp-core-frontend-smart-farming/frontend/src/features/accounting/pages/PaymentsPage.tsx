// src/features/accounting/pages/PaymentsPage.tsx
import { useState } from 'react';
import { D, fmtIdr, fmtKg } from '@/core/format/money';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Wallet, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<'MEMBER' | 'SUPPLIER' | 'CUSTOMER'>('MEMBER');
  const [member, setMember] = useState('1'); // Budi Santoso
  const [deductLoan, setDeductLoan] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Skenario UAT Cabai:
  // Hutang panen: Rp32.600.000 (dari sortasi cabai)
  // Piutang saprotan: Rp2.500.000 (pupuk & benih)
  // Kas bersih yang dibayarkan: Rp30.100.000
  const cropPayable = '32600000.00';
  const saprotanLoan = '2500000.00';
  const netCashPaid = deductLoan
    ? D(cropPayable).minus(D(saprotanLoan))
    : D(cropPayable);

  const handlePayMember = async () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success(
        `Pembayaran berhasil dicatat! Kas bersih ${fmtIdr(
          netCashPaid.toString()
        )} telah dibayarkan.`
      );
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
          <Wallet className="w-6 h-6 text-navy-700" />
          Pembayaran & Penerimaan Kas
        </h1>
        <p className="text-xs text-ink-600 mt-1">
          Penyelesaian hutang pembelian panen petani, pembayaran pemasok, dan penerimaan piutang dagang.
        </p>
      </div>

      {/* Tabs Navigasi */}
      <div className="flex border-b border-line gap-2">
        <button
          onClick={() => setActiveTab('MEMBER')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'MEMBER'
              ? 'border-navy-700 text-navy-700'
              : 'border-transparent text-ink-600 hover:text-ink-900'
          }`}
        >
          Bayar Anggota Tani
        </button>
        <button
          onClick={() => setActiveTab('SUPPLIER')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'SUPPLIER'
              ? 'border-navy-700 text-navy-700'
              : 'border-transparent text-ink-600 hover:text-ink-900'
          }`}
        >
          Bayar Supplier Logistik
        </button>
        <button
          onClick={() => setActiveTab('CUSTOMER')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'CUSTOMER'
              ? 'border-navy-700 text-navy-700'
              : 'border-transparent text-ink-600 hover:text-ink-900'
          }`}
        >
          Terima Pembayaran Pelanggan
        </button>
      </div>

      {activeTab === 'MEMBER' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Kolom Kiri: Pilih Anggota & Tagihan */}
          <div className="rounded-panel border border-line bg-surface p-5 shadow-sm space-y-4">
            <h2 className="font-bold text-sm text-ink-900">1. Anggota & Kewajiban Panen</h2>

            <div>
              <label className="block text-xs font-semibold text-ink-900 mb-1">
                Pilih Anggota Tani
              </label>
              <Select
                options={[
                  { value: '1', label: 'AGT-00001 - Budi Santoso' },
                  { value: '2', label: 'AGT-00002 - Siti Aminah' },
                ]}
                value={member}
                onChange={(e) => setMember(e.target.value)}
              />
            </div>

            <div className="p-4 rounded-control bg-canvas border border-line space-y-2 text-xs">
              <span className="font-bold text-navy-700 uppercase tracking-wide block">
                Hutang Panen Terbuka
              </span>
              <div className="flex justify-between">
                <span>Batch BATCH-20261114-001 (Cabai)</span>
                <span className="font-mono font-bold text-ink-900">{fmtIdr(cropPayable)}</span>
              </div>
              <p className="text-[11px] text-ink-600">Jatuh Tempo: 14 Hari setelah Sortasi</p>
            </div>

            {/* Opsi Potong Piutang Saprotan */}
            <div className="p-4 rounded-control bg-amber-50/70 border border-amber-200 space-y-2 text-xs">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deductLoan}
                  onChange={(e) => setDeductLoan(e.target.checked)}
                  className="w-4 h-4 text-navy-700 rounded mt-0.5"
                />
                <div>
                  <span className="font-bold text-amber-900 block">
                    Potong Piutang Saprotan Petani
                  </span>
                  <span className="text-amber-800">
                    Otomatis kurangi kewajiban pembayaran dengan tagihan saprotan/pupuk berjalan (
                    {fmtIdr(saprotanLoan)}).
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Kolom Kanan: Rincian Kas Bersih & Konfirmasi */}
          <div className="rounded-panel border border-line bg-surface p-5 shadow-sm flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <h2 className="font-bold text-sm text-ink-900">2. Rincian Realisasi Pembayaran</h2>

              <div className="space-y-2 text-sm border-b border-line pb-4">
                <div className="flex justify-between">
                  <span className="text-ink-600">Hutang Hasil Panen</span>
                  <span className="font-mono font-semibold text-ink-900">{fmtIdr(cropPayable)}</span>
                </div>
                {deductLoan && (
                  <div className="flex justify-between text-coral-700">
                    <span>Potongan Piutang Saprotan</span>
                    <span className="font-mono font-semibold">- {fmtIdr(saprotanLoan)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-line text-base font-bold">
                  <span className="text-ink-900">Kas Bersih Dibayarkan</span>
                  <span className="font-mono text-navy-800 text-lg">
                    {fmtIdr(netCashPaid.toString())}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-900 mb-1">
                  Metode Pembayaran
                </label>
                <Select
                  options={[
                    { value: 'TRANSFER', label: 'Transfer Bank Koperasi / QRIS' },
                    { value: 'CASH', label: 'Tunai di Kasir Kantor' },
                  ]}
                  value="TRANSFER"
                  onChange={() => {}}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-900 mb-1">
                  Nomor Referensi / Bukti Transfer
                </label>
                <Input placeholder="Contoh: TRF-20261116-0091" defaultValue="TRF-20261116-0091" />
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              loading={submitting}
              onClick={handlePayMember}
              className="w-full font-bold gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Catat Pembayaran Kas
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

