// src/features/traceability/pages/TraceSearchPage.tsx
import { useState } from 'react';
import { useBarcodeWedge } from '@/core/hardware/useBarcodeWedge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { fmtKg } from '@/core/format/money';
import { fmtDate } from '@/core/format/date';
import {
  Search,
  Route,
  User,
  Scale,
  ListChecks,
  Truck,
  Receipt,
  Download,
  QrCode,
  CheckCircle2,
} from 'lucide-react';

export default function TraceSearchPage() {
  const [query, setQuery] = useState('BATCH-20261114-001');
  const [searched, setSearched] = useState(true);

  // Keyboard wedge listener for QR / barcode
  useBarcodeWedge((scanned) => {
    setQuery(scanned.replace(/^BATCH:/, ''));
    setSearched(true);
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
          <Route className="w-6 h-6 text-navy-700" />
          Ketertelusuran Rantai Pasok (Batch Traceability)
        </h1>
        <p className="text-xs text-ink-600 mt-1">
          Pelacakan transparan ujung-ke-ujung (End-to-End) dari petani produsen hingga konsumen akhir.
        </p>
      </div>

      {/* Kolom Pencarian Kode */}
      <div className="rounded-panel border border-line bg-surface p-5 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearched(true);
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Masukkan kode batch, no. faktur, surat jalan, atau scan QR..."
              className="pl-10 text-base font-mono"
            />
            <Search className="w-5 h-5 text-ink-600 absolute left-3.5 top-3 pointer-events-none" />
          </div>
          <Button type="submit" variant="primary" size="md" className="gap-2">
            <Search className="w-4 h-4" />
            Telusuri Rantai
          </Button>
        </form>
      </div>

      {/* Hasil Pelacakan Rantai Pasok */}
      {searched && (
        <div className="rounded-panel border border-line bg-surface p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-line pb-4 gap-3">
            <div>
              <span className="text-xs uppercase font-bold text-ink-600">Kode Batch Pelacakan</span>
              <p className="text-2xl font-extrabold text-navy-800 font-mono">{query}</p>
              <p className="text-xs text-green-700 font-semibold flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-4 h-4" />
                Rantai pasok 100% tervalidasi integritasnya
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <QrCode className="w-4 h-4" />
                Cetak Label QR
              </Button>
              <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
                <Download className="w-4 h-4" />
                Unduh Gambar QR
              </Button>
            </div>
          </div>

          {/* Timeline Node Rantai Pasok */}
          <div className="relative border-l-2 border-navy-700 ml-4 sm:ml-6 pl-6 sm:pl-8 space-y-8 my-4">
            {/* 1. Petani Produsen */}
            <div className="relative">
              <div className="absolute -left-[35px] sm:-left-[43px] top-0 w-8 h-8 rounded-full bg-navy-700 text-white flex items-center justify-center shadow-md">
                <User className="w-4 h-4" />
              </div>
              <div className="bg-canvas p-4 rounded-control border border-line">
                <span className="text-[11px] font-bold text-navy-700 uppercase">Tahap 1 · Petani Produsen</span>
                <h3 className="font-bold text-base text-ink-900 mt-0.5">Budi Santoso (AGT-00001)</h3>
                <p className="text-xs text-ink-600 mt-1">
                  Lokasi Lahan: Desa Sukatani, Blok B-04 (1,20 ha) · Praktik Tani: Organik Ramah Lingkungan
                </p>
              </div>
            </div>

            {/* 2. Setoran & Timbang Panen */}
            <div className="relative">
              <div className="absolute -left-[35px] sm:-left-[43px] top-0 w-8 h-8 rounded-full bg-navy-700 text-white flex items-center justify-center shadow-md">
                <Scale className="w-4 h-4" />
              </div>
              <div className="bg-canvas p-4 rounded-control border border-line">
                <span className="text-[11px] font-bold text-navy-700 uppercase">Tahap 2 · Penerimaan Panen</span>
                <div className="flex justify-between items-start mt-0.5">
                  <div>
                    <h3 className="font-bold text-base text-ink-900">STR-202611-001 (Cabai Merah Keriting)</h3>
                    <p className="text-xs text-ink-600">Diterima: {fmtDate('2026-11-14')} di Gudang Mentah (GD-MTH)</p>
                  </div>
                  <span className="readout font-bold text-sm text-ink-900 bg-white px-2.5 py-1 rounded border border-line">
                    {fmtKg('1000.00')}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Meja Sortasi & QC */}
            <div className="relative">
              <div className="absolute -left-[35px] sm:-left-[43px] top-0 w-8 h-8 rounded-full bg-navy-700 text-white flex items-center justify-center shadow-md">
                <ListChecks className="w-4 h-4" />
              </div>
              <div className="bg-canvas p-4 rounded-control border border-line">
                <span className="text-[11px] font-bold text-navy-700 uppercase">Tahap 3 · Sortasi & Grading</span>
                <div className="mt-0.5">
                  <h3 className="font-bold text-base text-ink-900">SRT-2026110001 (Lolos QC)</h3>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-xs font-semibold">
                    <div className="bg-white p-2 rounded border border-line text-center">
                      <span className="text-ink-600 block text-[10px]">Grade A</span>
                      <span className="font-bold text-green-700">{fmtKg('700.00')}</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-line text-center">
                      <span className="text-ink-600 block text-[10px]">Grade B</span>
                      <span className="font-bold text-navy-700">{fmtKg('200.00')}</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-line text-center">
                      <span className="text-ink-600 block text-[10px]">Afkir</span>
                      <span className="font-bold text-coral-700">{fmtKg('100.00')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Pengiriman & Surat Jalan */}
            <div className="relative">
              <div className="absolute -left-[35px] sm:-left-[43px] top-0 w-8 h-8 rounded-full bg-navy-700 text-white flex items-center justify-center shadow-md">
                <Truck className="w-4 h-4" />
              </div>
              <div className="bg-canvas p-4 rounded-control border border-line">
                <span className="text-[11px] font-bold text-navy-700 uppercase">Tahap 4 · Distribusi & Pengiriman</span>
                <h3 className="font-bold text-base text-ink-900 mt-0.5">DO-2026110005</h3>
                <p className="text-xs text-ink-600 mt-1">
                  Kendaraan: Pick-up B 1234 CD · Jarak: 25 km · Emisi Tercatat: 4,2 kg CO2e
                </p>
              </div>
            </div>

            {/* 5. Pelanggan Akhir & Faktur */}
            <div className="relative">
              <div className="absolute -left-[35px] sm:-left-[43px] top-0 w-8 h-8 rounded-full bg-green-700 text-white flex items-center justify-center shadow-md">
                <Receipt className="w-4 h-4" />
              </div>
              <div className="bg-green-50 p-4 rounded-control border border-green-200">
                <span className="text-[11px] font-bold text-green-700 uppercase">Tahap 5 · Pelanggan & Penjualan</span>
                <h3 className="font-bold text-base text-ink-900 mt-0.5">Toko Maju Jaya (Retail)</h3>
                <p className="text-xs text-ink-600 mt-1">
                  Faktur INV-2026110003 · Nilai: Rp39.400.000 (Lunas)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

