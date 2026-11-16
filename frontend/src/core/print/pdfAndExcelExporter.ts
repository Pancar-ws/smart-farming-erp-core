import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import * as XLSX from 'xlsx';

type JsPDFWithAutoTable = jsPDF & {
  lastAutoTable?: { finalY: number };
};

export const formatRupiah = (angka: number): string =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);

export const formatBeratKg = (berat: number): string =>
  `${new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(berat)} kg`;

export const formatTanggalID = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const tambahKopKoperasi = (doc: jsPDF, judulDokumen: string, nomorDokumen: string) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(22, 101, 52);
  doc.text('KOPERASI TANI AGRIBISNIS SMART FARMING', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  doc.text('Sistem ERP Manajemen Rantai Pasok Pertanian Berkelanjutan', 14, 23.5);

  doc.setDrawColor(22, 101, 52);
  doc.setLineWidth(0.6);
  doc.line(14, 27, 196, 27);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(15, 23, 42);
  doc.text(judulDokumen.toUpperCase(), 14, 35);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`No. Dokumen : ${nomorDokumen}`, 14, 41);
};

export interface BuktiTimbangData {
  id_setoran: string;
  id_batch_asal: string;
  tanggal_setor: string;
  id_anggota: string;
  nama_petani: string;
  alamat_lahan: string;
  komoditas: string;
  berat_kotor_kg: number;
  status_qc: 'Pending' | 'Lolos' | 'Gagal';
  petugas_penerima: string;
}

export interface ItemPengiriman {
  kode_produk: string;
  nama_produk: string;
  grade: string;
  id_batch: string;
  qty_kg: number;
  harga_satuan?: number;
}

export interface SuratJalanData {
  no_surat_jalan: string;
  id_sales_order: string;
  tanggal_kirim: string;
  nama_pelanggan: string;
  segmen_pembeli: 'Konsumen' | 'Retail' | 'Modern';
  alamat_tujuan: string;
  nama_sopir: string;
  no_kendaraan: string;
  items: ItemPengiriman[];
}

export interface FakturPenjualanData {
  no_faktur: string;
  id_sales_order: string;
  no_surat_jalan: string;
  tanggal_faktur: string;
  jatuh_tempo: string;
  nama_pelanggan: string;
  segmen_pembeli: 'Konsumen' | 'Retail' | 'Modern';
  alamat_pelanggan: string;
  items: Required<ItemPengiriman>[];
}

// 1. PDF BUKTI TIMBANG (dengan QR Code Traceability Batch)
export const exportBuktiTimbangPDF = async (data: BuktiTimbangData): Promise<void> => {
  const doc = new jsPDF() as JsPDFWithAutoTable;
  tambahKopKoperasi(doc, 'Bukti Timbang Penerimaan Panen Anggota', data.id_setoran);

  const qrPayload = JSON.stringify({
    setoran: data.id_setoran,
    batch: data.id_batch_asal,
    anggota: data.id_anggota,
    berat_kg: data.berat_kotor_kg,
  });
  const qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 100, margin: 1 });
  doc.addImage(qrDataUrl, 'PNG', 166, 30, 28, 28);

  autoTable(doc, {
    startY: 48,
    theme: 'plain',
    styles: { fontSize: 9.5, cellPadding: 1.8 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 46 } },
    body: [
      ['Tanggal Penerimaan', `: ${formatTanggalID(data.tanggal_setor)}`],
      ['Nomor Batch Unik', `: ${data.id_batch_asal}`],
      ['Petani Anggota', `: ${data.id_anggota} — ${data.nama_petani}`],
      ['Lokasi Lahan', `: ${data.alamat_lahan}`],
      ['Status QC Awal', `: ${data.status_qc}`],
    ],
  });

  autoTable(doc, {
    startY: (doc.lastAutoTable?.finalY ?? 84) + 6,
    head: [['Komoditas', 'Nomor Batch Induk', 'Berat Kotor Timbangan', 'Status QC']],
    body: [[data.komoditas, data.id_batch_asal, formatBeratKg(data.berat_kotor_kg), data.status_qc]],
    headStyles: { fillColor: [22, 101, 52] },
    styles: { fontSize: 9.5, halign: 'center' },
  });

  const finalY = (doc.lastAutoTable?.finalY ?? 118) + 18;
  doc.setFontSize(9);
  doc.text('Petugas Penerimaan Gudang,', 24, finalY);
  doc.text('Petani Anggota Penyetor,', 136, finalY);
  doc.text(`( ${data.petugas_penerima} )`, 24, finalY + 22);
  doc.text(`( ${data.nama_petani} )`, 136, finalY + 22);

  doc.save(`Bukti_Timbang_${data.id_setoran}.pdf`);
};

// 2. PDF SURAT JALAN (DELIVERY ORDER - FIFO BATCH)
export const exportSuratJalanPDF = (data: SuratJalanData): void => {
  const doc = new jsPDF() as JsPDFWithAutoTable;
  tambahKopKoperasi(doc, 'Surat Jalan Pengiriman Barang (Delivery Order)', data.no_surat_jalan);

  autoTable(doc, {
    startY: 47,
    theme: 'plain',
    styles: { fontSize: 9.5, cellPadding: 1.8 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } },
    body: [
      ['No. Sales Order', `: ${data.id_sales_order}`],
      ['Tanggal Kirim', `: ${formatTanggalID(data.tanggal_kirim)}`],
      ['Pelanggan / Segmen', `: ${data.nama_pelanggan} (${data.segmen_pembeli})`],
      ['Alamat Tujuan', `: ${data.alamat_tujuan}`],
      ['Pengemudi / Kendaraan', `: ${data.nama_sopir} (${data.no_kendaraan})`],
    ],
  });

  const totalBerat = data.items.reduce((acc, item) => acc + item.qty_kg, 0);

  autoTable(doc, {
    startY: (doc.lastAutoTable?.finalY ?? 84) + 6,
    head: [['No', 'Komoditas / Produk', 'Grade', 'Nomor Batch (FIFO)', 'Kuantitas']],
    body: data.items.map((item, idx) => [
      idx + 1,
      item.nama_produk,
      item.grade,
      item.id_batch,
      formatBeratKg(item.qty_kg),
    ]),
    foot: [['', '', '', 'TOTAL BERAT KIRIM', formatBeratKg(totalBerat)]],
    headStyles: { fillColor: [22, 101, 52] },
    footStyles: { fillColor: [240, 253, 244], textColor: [15, 23, 42], fontStyle: 'bold' },
    styles: { fontSize: 9.5 },
  });

  const finalY = (doc.lastAutoTable?.finalY ?? 128) + 18;
  doc.setFontSize(9);
  doc.text('Bagian Penjualan & Gudang,', 20, finalY);
  doc.text('Pengemudi,', 92, finalY);
  doc.text('Penerima (Pelanggan),', 148, finalY);
  doc.text('( .............................. )', 20, finalY + 22);
  doc.text(`( ${data.nama_sopir} )`, 92, finalY + 22);
  doc.text('( .............................. )', 148, finalY + 22);

  doc.save(`Surat_Jalan_${data.no_surat_jalan}.pdf`);
};

// 3. PDF FAKTUR PENJUALAN (SALES INVOICE)
export const exportFakturPenjualanPDF = (data: FakturPenjualanData): void => {
  const doc = new jsPDF() as JsPDFWithAutoTable;
  tambahKopKoperasi(doc, 'Faktur Penjualan (Sales Invoice)', data.no_faktur);

  autoTable(doc, {
    startY: 47,
    theme: 'plain',
    styles: { fontSize: 9.5, cellPadding: 1.8 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } },
    body: [
      ['Ref. Sales Order / SJ', `: ${data.id_sales_order} / ${data.no_surat_jalan}`],
      ['Tanggal Faktur', `: ${formatTanggalID(data.tanggal_faktur)}`],
      ['Jatuh Tempo', `: ${formatTanggalID(data.jatuh_tempo)}`],
      ['Kepada Yth.', `: ${data.nama_pelanggan} [Segmen: ${data.segmen_pembeli}]`],
      ['Alamat Penagihan', `: ${data.alamat_pelanggan}`],
    ],
  });

  const grandTotal = data.items.reduce(
    (sum, item) => sum + item.qty_kg * item.harga_satuan,
    0
  );

  autoTable(doc, {
    startY: (doc.lastAutoTable?.finalY ?? 84) + 6,
    head: [['No', 'Produk', 'Grade', 'No. Batch', 'Berat', 'Harga / kg', 'Subtotal']],
    body: data.items.map((item, idx) => [
      idx + 1,
      item.nama_produk,
      item.grade,
      item.id_batch,
      formatBeratKg(item.qty_kg),
      formatRupiah(item.harga_satuan),
      formatRupiah(item.qty_kg * item.harga_satuan),
    ]),
    foot: [['', '', '', '', '', 'TOTAL TAGIHAN', formatRupiah(grandTotal)]],
    headStyles: { fillColor: [22, 101, 52] },
    footStyles: { fillColor: [22, 101, 52], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9 },
  });

  const finalY = (doc.lastAutoTable?.finalY ?? 134) + 14;
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text(
    'Catatan: Nomor batch di atas menjamin ketertelusuran produk hingga lahan petani anggota (SRS-SLS-007).',
    14,
    finalY
  );
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.text('Hormat Kami, Bagian Keuangan Koperasi', 130, finalY + 12);
  doc.text('( ........................................ )', 130, finalY + 32);

  doc.save(`Faktur_Penjualan_${data.no_faktur}.pdf`);
};

// 4. EKSPOR EXCEL (.XLSX) LAPORAN STOK MULTI-SHEET (ROP, FIFO BATCH, & SUSUT SORTASI)
export const exportLaporanStokExcel = (): void => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Stok Saprotan & Peringatan Reorder Point (URS-RPT-001)
  const wsSaprotan = XLSX.utils.json_to_sheet([
    {
      'ID Saprotan': 'SPT-00001',
      'Nama Item': 'Benih Cabai Unggul',
      Kategori: 'Benih',
      Gudang: 'Gudang Saprotan A',
      'Stok Tersedia': 120,
      'Batas Minimum (ROP)': 50,
      Satuan: 'pak',
      'Harga Satuan (Rp)': 150000,
      'Status ROP': 'AMAN',
    },
    {
      'ID Saprotan': 'SPT-00002',
      'Nama Item': 'Pupuk NPK Phonska',
      Kategori: 'NPK',
      Gudang: 'Gudang Saprotan A',
      'Stok Tersedia': 420,
      'Batas Minimum (ROP)': 500,
      Satuan: 'kg',
      'Harga Satuan (Rp)': 12000,
      'Status ROP': 'PERINGATAN: DI BAWAH ROP (< 500 kg)',
    },
    {
      'ID Saprotan': 'SPT-00003',
      'Nama Item': 'Pupuk Organik Kompos',
      Kategori: 'Organik',
      Gudang: 'Gudang Saprotan A',
      'Stok Tersedia': 1250,
      'Batas Minimum (ROP)': 500,
      Satuan: 'kg',
      'Harga Satuan (Rp)': 4000,
      'Status ROP': 'AMAN',
    },
  ]);
  XLSX.utils.book_append_sheet(wb, wsSaprotan, 'Stok Saprotan (ROP)');

  // Sheet 2: Stok Hasil Panen per Batch & Grade FIFO (URS-RPT-002)
  const wsPanen = XLSX.utils.json_to_sheet([
    {
      'Nomor Batch (FIFO)': 'BATCH-20261116-001',
      Komoditas: 'Cabai Rawit Merah',
      Grade: 'Grade A (Super)',
      'Petani Asal': 'Budi Santoso (AGT-00014)',
      'Tanggal Sortasi': '16/11/2026',
      'Stok Tersedia (kg)': 700,
      'Harga Beli/kg (Rp)': 38000,
      'Harga Jual/kg (Rp)': 46000,
      'Margin Kotor Potensial (Rp)': 5600000,
    },
    {
      'Nomor Batch (FIFO)': 'BATCH-20261116-001',
      Komoditas: 'Cabai Rawit Merah',
      Grade: 'Grade B (Medium)',
      'Petani Asal': 'Budi Santoso (AGT-00014)',
      'Tanggal Sortasi': '16/11/2026',
      'Stok Tersedia (kg)': 200,
      'Harga Beli/kg (Rp)': 30000,
      'Harga Jual/kg (Rp)': 36000,
      'Margin Kotor Potensial (Rp)': 1200000,
    },
  ]);
  XLSX.utils.book_append_sheet(wb, wsPanen, 'Stok Panen Batch (FIFO)');

  // Sheet 3: Laporan Efisiensi Sortasi & Susut (URS-RPT-004)
  const wsSortasi = XLSX.utils.json_to_sheet([
    {
      'Nomor Batch': 'BATCH-20261116-001',
      Komoditas: 'Cabai Rawit Merah',
      'Berat Input (kg)': 1000,
      'Output Grade A/Prem (kg)': 700,
      'Output Grade B/Med (kg)': 200,
      'Susut / Afkir (kg)': 100,
      'Persentase Susut (%)': 10.0,
    },
    {
      'Nomor Batch': 'BATCH-20261115-002',
      Komoditas: 'Beras Pangan',
      'Berat Input (kg)': 2000,
      'Output Grade A/Prem (kg)': 1800,
      'Output Grade B/Med (kg)': 150,
      'Susut / Afkir (kg)': 50,
      'Persentase Susut (%)': 2.5,
    },
    {
      'Nomor Batch': 'BATCH-20261114-003',
      Komoditas: 'Pisang Cavendish',
      'Berat Input (kg)': 800,
      'Output Grade A/Prem (kg)': 560,
      'Output Grade B/Med (kg)': 180,
      'Susut / Afkir (kg)': 60,
      'Persentase Susut (%)': 7.5,
    },
  ]);
  XLSX.utils.book_append_sheet(wb, wsSortasi, 'Efisiensi Sortasi & Susut');

  XLSX.writeFile(wb, `Laporan_Stok_ERP_SmartFarming_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

// 5. PDF REKAP LAPORAN OPERASIONAL (Fallback Offline / Cetak Langsung)
export const exportLaporanOperasionalPDF = (judulLaporan: string): void => {
  const doc = new jsPDF() as JsPDFWithAutoTable;
  tambahKopKoperasi(doc, judulLaporan, `RPT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`);

  autoTable(doc, {
    startY: 48,
    head: [['Batch / Kode', 'Komoditas / Item', 'Input / Awal', 'Output / Realisasi', 'Keterangan / Susut']],
    body: [
      ['BATCH-20261116-001', 'Cabai Rawit Merah', '1.000,00 kg', 'Grade A: 700 kg | B: 200 kg', 'Susut Afkir: 100 kg (10,0%)'],
      ['BATCH-20261115-002', 'Beras Pangan', '2.000,00 kg', 'Prem: 1.800 kg | Med: 150 kg', 'Susut Afkir: 50 kg (2,5%)'],
      ['BATCH-20261114-003', 'Pisang Cavendish', '800,00 kg', 'Grade A: 560 kg | B: 180 kg', 'Susut Afkir: 60 kg (7,5%)'],
      ['SPT-00002', 'Pupuk NPK Phonska', '1.000,00 kg', 'Sisa Stok: 420,00 kg', 'PERINGATAN ROP (< 500 kg)'],
    ],
    headStyles: { fillColor: [22, 101, 52] },
    styles: { fontSize: 9 },
  });

  doc.save(`${judulLaporan.replace(/[^\w.-]+/g, '_')}.pdf`);
};
