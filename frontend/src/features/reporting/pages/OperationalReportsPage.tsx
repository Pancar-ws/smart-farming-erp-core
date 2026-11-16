import { Button } from '@/components/ui/Button';
import { BarChart3, Download, FileText, Truck, Receipt, FileSpreadsheet } from 'lucide-react';
import { downloadReport } from '@/core/api/download';
import {
  exportBuktiTimbangPDF,
  exportSuratJalanPDF,
  exportFakturPenjualanPDF,
  exportLaporanStokExcel,
  exportLaporanOperasionalPDF,
} from '@/core/print/pdfAndExcelExporter';

export default function OperationalReportsPage() {
  const reports = [
    {
      title: 'Laporan Stok Saprotan & Peringatan ROP',
      desc: 'Stok benih, pupuk organik, dan NPK beserta penanda batas minimum (< 500 kg).',
      path: '/reports/saprotan-stock',
    },
    {
      title: 'Laporan Stok Hasil Panen per Batch & Grade (FIFO)',
      desc: 'Rincian stok barang jadi terkemas per nomor batch, grade mutu, dan petani asal.',
      path: '/reports/harvest-stock',
    },
    {
      title: 'Laporan Efisiensi & Susut Sortasi',
      desc: 'Analisis berat input curah, yield output per grade, dan persentase afkir/susut.',
      path: '/reports/sorting-efficiency',
    },
    {
      title: 'Laporan Realisasi Penjualan & DO',
      desc: 'Rekapitulasi penjualan per segmen retail, pasar modern, dan konsumen langsung.',
      path: '/reports/sales-summary',
    },
  ];

  const handleUnduhLaporan = async (path: string, format: 'xlsx' | 'pdf', title: string) => {
    try {
      await downloadReport(path, {}, format, title);
    } catch {
      // Fallback otomatis ke generator client-side jika server backend belum menyala
      if (format === 'xlsx') {
        exportLaporanStokExcel();
      } else {
        exportLaporanOperasionalPDF(title);
      }
    }
  };

  const handleCetakBuktiTimbang = () =>
    exportBuktiTimbangPDF({
      id_setoran: 'STR-202611-001',
      id_batch_asal: 'BATCH-20261116-001',
      tanggal_setor: '2026-11-16',
      id_anggota: 'AGT-00014',
      nama_petani: 'Budi Santoso',
      alamat_lahan: 'Blok Sawah Lor, Desa Karanganyar, Purbalingga',
      komoditas: 'Cabai Rawit Merah',
      berat_kotor_kg: 1000,
      status_qc: 'Lolos',
      petugas_penerima: 'Salsabilla Rahma',
    });

  const handleCetakSuratJalan = () =>
    exportSuratJalanPDF({
      no_surat_jalan: 'SJ-202611-001',
      id_sales_order: 'SO-202611-0001',
      tanggal_kirim: '2026-11-16',
      nama_pelanggan: 'Supermarket Segar Jaya Purwokerto',
      segmen_pembeli: 'Modern',
      alamat_tujuan: 'Jl. Jenderal Soedirman No. 112, Purwokerto',
      nama_sopir: 'Slamet Riyadi',
      no_kendaraan: 'R 8421 AB',
      items: [
        {
          kode_produk: 'PRD-CB-A',
          nama_produk: 'Cabai Rawit Merah Kemas',
          grade: 'Grade A (Super)',
          id_batch: 'BATCH-20261116-001',
          qty_kg: 700,
        },
        {
          kode_produk: 'PRD-CB-B',
          nama_produk: 'Cabai Rawit Merah Kemas',
          grade: 'Grade B (Medium)',
          id_batch: 'BATCH-20261116-001',
          qty_kg: 200,
        },
      ],
    });

  const handleCetakFaktur = () =>
    exportFakturPenjualanPDF({
      no_faktur: 'INV-202611-001',
      id_sales_order: 'SO-202611-0001',
      no_surat_jalan: 'SJ-202611-001',
      tanggal_faktur: '2026-11-16',
      jatuh_tempo: '2026-11-30',
      nama_pelanggan: 'Supermarket Segar Jaya Purwokerto',
      segmen_pembeli: 'Modern',
      alamat_pelanggan: 'Jl. Jenderal Soedirman No. 112, Purwokerto',
      items: [
        {
          kode_produk: 'PRD-CB-A',
          nama_produk: 'Cabai Rawit Merah Kemas',
          grade: 'Grade A (Super)',
          id_batch: 'BATCH-20261116-001',
          qty_kg: 700,
          harga_satuan: 46000,
        },
        {
          kode_produk: 'PRD-CB-B',
          nama_produk: 'Cabai Rawit Merah Kemas',
          grade: 'Grade B (Medium)',
          id_batch: 'BATCH-20261116-001',
          qty_kg: 200,
          harga_satuan: 36000,
        },
      ],
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-navy-700" />
          Pusat Laporan Operasional &amp; Cetak Dokumen
        </h1>
        <p className="text-xs text-ink-600 mt-1">
          Render dokumen transaksi resmi (Bukti Timbang, Surat Jalan, Faktur Penjualan) serta ekspor laporan stok ke Excel (.xlsx) dan PDF.
        </p>
      </div>

      {/* Bagian 1: Cetak Dokumen Transaksi Resmi (PDF) */}
      <div className="rounded-panel border border-line bg-surface p-5 shadow-sm space-y-4">
        <div className="border-b border-line pb-3">
          <h2 className="font-bold text-base text-ink-900">
            1. Render Dokumen Transaksi Resmi (Format PDF)
          </h2>
          <p className="text-xs text-ink-600 mt-0.5">
            Dokumen dilengkapi nomor batch unik untuk ketertelusuran end-to-end (SRS-PRC-005 &amp; SRS-SLS-007).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-control bg-canvas border border-line flex flex-col justify-between space-y-3">
            <div>
              <h3 className="font-bold text-sm text-ink-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-green-700" />
                Bukti Timbang Panen
              </h3>
              <p className="text-xs text-ink-600 mt-1">
                Nota penerimaan setoran panen anggota beserta QR Code batch induk.
              </p>
            </div>
            <Button size="sm" onClick={handleCetakBuktiTimbang} className="gap-1.5 w-full">
              <Download className="w-3.5 h-3.5" />
              Cetak PDF Bukti Timbang
            </Button>
          </div>

          <div className="p-4 rounded-control bg-canvas border border-line flex flex-col justify-between space-y-3">
            <div>
              <h3 className="font-bold text-sm text-ink-900 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-navy-700" />
                Surat Jalan (Delivery Order)
              </h3>
              <p className="text-xs text-ink-600 mt-1">
                Dokumen pengiriman logistik dengan rincian grade &amp; batch alokasi FIFO.
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={handleCetakSuratJalan} className="gap-1.5 w-full">
              <Download className="w-3.5 h-3.5" />
              Cetak PDF Surat Jalan
            </Button>
          </div>

          <div className="p-4 rounded-control bg-canvas border border-line flex flex-col justify-between space-y-3">
            <div>
              <h3 className="font-bold text-sm text-ink-900 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-blue-700" />
                Faktur Penjualan (Invoice)
              </h3>
              <p className="text-xs text-ink-600 mt-1">
                Tagihan komersial berdasarkan harga bertingkat per segmen pembeli.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={handleCetakFaktur} className="gap-1.5 w-full">
              <Download className="w-3.5 h-3.5" />
              Cetak PDF Faktur
            </Button>
          </div>
        </div>
      </div>

      {/* Bagian 2: Ekspor Laporan Stok & Operasional (.xlsx & .pdf) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="font-bold text-base text-ink-900">
            2. Rekapitulasi Laporan Stok &amp; Operasional
          </h2>
          <Button size="sm" onClick={exportLaporanStokExcel} className="gap-1.5">
            <FileSpreadsheet className="w-4 h-4" />
            Unduh Paket Lengkap Stok (.xlsx)
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {reports.map((r, i) => (
            <div
              key={i}
              className="rounded-panel border border-line bg-surface p-5 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div>
                <h3 className="font-bold text-base text-ink-900">{r.title}</h3>
                <p className="text-xs text-ink-600 mt-1">{r.desc}</p>
              </div>
              <div className="flex gap-2 pt-2 border-t border-line">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnduhLaporan(r.path, 'xlsx', r.title)}
                  className="gap-1.5 flex-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Excel (.xlsx)
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleUnduhLaporan(r.path, 'pdf', r.title)}
                  className="gap-1.5 flex-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  PDF
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
