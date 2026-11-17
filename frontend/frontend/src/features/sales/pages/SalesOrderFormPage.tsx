// src/features/sales/pages/SalesOrderFormPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/core/api/client';
import { D, fmtIdr, fmtKg } from '@/core/format/money';
import { Button } from '@/components/ui/Button';
import { NumberInput } from '@/components/ui/NumberInput';
import { Select } from '@/components/ui/Select';
import { ArrowLeft, CheckCircle2, AlertCircle, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  product_name: string;
  grade_name: string;
  qty: string;
  available: string;
  price: string;
  allocations: Array<{ batch: string; qty: string }>;
}

export default function SalesOrderFormPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  // Skenario UAT Cabai Penjualan
  const [customer, setCustomer] = useState('1'); // Toko Maju Jaya
  const [items, setItems] = useState<OrderItem[]>([
    {
      id: '1',
      product_name: 'Cabai Merah Keriting',
      grade_name: 'Grade A (Super)',
      qty: '700.00',
      available: '700.00',
      price: '46000',
      allocations: [
        { batch: 'BATCH-20261112-004', qty: '400,00 kg' },
        { batch: 'BATCH-20261114-001', qty: '300,00 kg' },
      ],
    },
    {
      id: '2',
      product_name: 'Cabai Merah Keriting',
      grade_name: 'Grade B (Medium)',
      qty: '200.00',
      available: '200.00',
      price: '36000',
      allocations: [{ batch: 'BATCH-20261114-001', qty: '200,00 kg' }],
    },
  ]);

  const updateQty = (id: string, newQty: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, qty: newQty } : it))
    );
  };

  const totalOrder = items.reduce(
    (acc, it) => acc.plus(D(it.qty).times(D(it.price))),
    D(0)
  );

  const hasStockError = items.some((it) => D(it.qty).gt(D(it.available)));

  const handleSaveOrder = async () => {
    if (hasStockError) {
      toast.error('Jumlah pesanan melebihi stok yang tersedia.');
      return;
    }

    setSubmitting(true);
    try {
      await api('/sales/orders', {
        method: 'POST',
        json: {
          customer_id: Number(customer),
          items: items.map((it) => ({
            product_name: it.product_name,
            grade_name: it.grade_name,
            qty: it.qty,
            unit_price: it.price,
          })),
        },
      });

      toast.success('Pesanan Penjualan berhasil dibuat!');
      navigate('/penjualan');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan pesanan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/penjualan')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Kembali
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Pesanan Penjualan Baru (SO)</h1>
          <p className="text-xs text-ink-600">
            Penetapan harga otomatis berbasis segmen pelanggan & pratinjau alokasi lot FIFO.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kolom Kiri: Informasi Pelanggan */}
        <div className="rounded-panel border border-line bg-surface p-5 shadow-sm space-y-4">
          <h2 className="font-bold text-sm text-ink-900">Data Pelanggan</h2>

          <div>
            <label className="block text-xs font-semibold text-ink-900 mb-1">
              Pilih Mitra Pembeli
            </label>
            <Select
              options={[
                { value: '1', label: 'Toko Maju Jaya (Retail)' },
                { value: '2', label: 'Pasar Induk Kramat Jati (Konsumen)' },
                { value: '3', label: 'Supermarket Segar Abadi (Modern)' },
              ]}
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
            />
          </div>

          <div className="p-3.5 rounded-control bg-canvas border border-line text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-ink-600">Segmen Pasar:</span>
              <span className="font-bold text-navy-700">Retail</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-600">Syarat Pembayaran:</span>
              <span className="font-semibold text-ink-900">Jatuh Tempo 14 Hari</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-600">Status Kredit:</span>
              <span className="font-semibold text-green-700">Lancar (Plafon Rp50 Jt)</span>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Rincian Produk SO (2 Span) */}
        <div className="md:col-span-2 rounded-panel border border-line bg-surface p-5 shadow-sm space-y-5">
          <h2 className="font-bold text-base text-ink-900 flex items-center justify-between">
            <span>Daftar Komoditas & Grade Dipesan</span>
            <span className="text-xs font-normal text-ink-600">
              Harga terkunci otomatis sesuai segmen
            </span>
          </h2>

          <div className="space-y-4">
            {items.map((it) => {
              const subtotal = D(it.qty).times(D(it.price));
              const exceedsStock = D(it.qty).gt(D(it.available));

              return (
                <div
                  key={it.id}
                  className={`p-4 rounded-control border transition-colors ${
                    exceedsStock ? 'border-coral-700 bg-coral-50/30' : 'border-line bg-white'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
                    <div>
                      <p className="font-bold text-sm text-ink-900">{it.product_name}</p>
                      <p className="text-xs text-navy-700 font-semibold">{it.grade_name}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-xs text-ink-600">Harga Segmen Retail:</span>
                      <p className="font-mono font-bold text-sm text-ink-900">
                        {fmtIdr(it.price)} / kg
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 items-center">
                    <div>
                      <label className="block text-xs font-semibold text-ink-900 mb-1">
                        Kuantitas Dipesan
                      </label>
                      <NumberInput
                        value={it.qty}
                        onChange={(v) => updateQty(it.id, v)}
                        unit="kg"
                        invalid={exceedsStock}
                      />
                    </div>

                    <div className="text-xs">
                      <span className="text-ink-600 block mb-1">Stok Tersedia di Gudang:</span>
                      <p className="font-bold text-sm text-ink-900">{fmtKg(it.available)}</p>
                      {exceedsStock && (
                        <p className="text-coral-700 font-semibold mt-0.5">
                          Melebihi stok tersedia!
                        </p>
                      )}
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-xs text-ink-600 block mb-1">Subtotal Nilai:</span>
                      <p className="readout font-bold text-lg text-ink-900 font-mono">
                        {fmtIdr(subtotal.toString())}
                      </p>
                    </div>
                  </div>

                  {/* Pratinjau Alokasi FIFO Batch */}
                  <div className="mt-3 pt-2 border-t border-dashed border-line text-xs flex flex-wrap items-center gap-2 text-ink-600">
                    <span className="font-semibold text-navy-700">Dialokasikan (FIFO):</span>
                    {it.allocations.map((a, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-canvas font-mono font-medium text-[11px] border border-line"
                      >
                        {a.batch} · {a.qty}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Baris Total & Aksi */}
          <div className="pt-4 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs text-ink-600">Total Nilai Pesanan Penjualan:</p>
              <p className="readout text-3xl font-extrabold text-navy-800">
                {fmtIdr(totalOrder.toString())}
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              loading={submitting}
              disabled={hasStockError}
              onClick={handleSaveOrder}
              className="w-full sm:w-auto font-bold gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              Simpan & Konfirmasi Pesanan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

