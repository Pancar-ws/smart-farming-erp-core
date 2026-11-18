# PANDUAN STRATEGIS ALUR DEMONSTRASI SISTEM ERP SMART FARMING
**Koperasi Tani Mandiri — Supply Chain Management & Operations Management Integration**

Dokumen ini disusun sebagai panduan operasional saat dosen penguji meminta demonstrasi langsung (*live demo*) aplikasi. Alur ini dirancang dengan pendekatan **Studi Kasus Terpadu (Single Continuous Story)** agar dosen melihat bahwa sistem ini benar-benar menyelesaikan 5 masalah utama operasional, menerapkan prinsip **Single Source of Truth**, dan memenuhi standar akademis **Operations Management**.

---

## 🎯 STRATEGI UTAMA DEMO (GOLDEN RULES)

1. **Gunakan "Storytelling Rantai Pasok", Bukan Sekadar Pamer Fitur:**
   * Jangan hanya mendemokan tombol per tombol secara acak.
   * Gunakan skenario: *"Pak Budi (Petani) menyetor panen Cabai 1.000 kg → Disortir → Masuk Gudang → Dijual ke Retail → Jurnal Otomatis & SHU → Masuk Laporan ESG Pengurus"*.
2. **Kaitkan dengan Teori Manajemen Operasi di Setiap Langkah:**
   * Sebutkan istilah kunci: *Single Source of Truth, Mass Balance, Quality Control, FIFO, Auto-Journaling, Triple Bottom Line (ESG)*.
3. **Tunjukkan "Mekanisme Kontrol / Validasi" (*The Wow Factor*):**
   * Perlihatkan bagaimana sistem **menolak** jika ada ketidakseimbangan berat (Mass Balance) agar dosen melihat adanya *Internal Control* yang tangguh.

---

## ⏱️ RINGKASAN TIMELINE DEMO (DURASI TOTAL: ~7-8 MENIT)

```
[00:00 - 01:00] INTRO & MASTER DATA (Single Source of Truth)
      ↓
[01:00 - 02:30] PENERIMAAN PANEN (Procurement & Traceability Batch)
      ↓
[02:30 - 04:00] SORTASI & QUALITY CONTROL (Mass Balance Validation)
      ↓
[04:00 - 05:00] GUDANG & FIFO (Inventory Management & ROP)
      ↓
[05:00 - 06:15] PENJUALAN & SURAT JALAN (Sales Order & Delivery)
      ↓
[06:15 - 07:15] AKUNTANSI OTOMATIS & SHU (Financial Transparency)
      ↓
[07:15 - 08:00] LAPORAN EKSEKUTIF & ESG (Sustainable Operations Management)
```

---

## 🎬 ALUR LANGKAH DEMO SECARA RINCI

### BABAK 1: Master Data & Single Source of Truth
* **Aktor / Login:** Superadmin atau Admin Keanggotaan (`admin` / `password123`)
* **Halaman:** `/` (Dashboard) → Master Data (Petani & Lahan)
* **Aksi Demo:**
  1. Tunjukkan halaman Dashboard ringkasan koperasi.
  2. Klik menu **Petani & Lahan**, tunjukkan data terpadu anggota (misal: Pak Budi Santoso - `MBR-001`, luas lahan, jenis komoditas cabai).
* **Narasi ke Dosen:**
  > *"Bapak/Ibu dosen, seperti yang kami sampaikan di Slide 4, fondasi utama ERP adalah **Single Source of Truth**. Sebelum transaksi berjalan, seluruh data master seperti petani, komoditas, dan gudang terpusat di sini. Tidak ada lagi duplikasi catatan antar-buku."*

---

### BABAK 2: Penerimaan Panen (Procurement & Lot Tracing)
* **Aktor / Login:** Petugas Penerimaan (`penerimaan` / `password123`)
* **Halaman:** `/procurement/harvest-receipts`
* **Aksi Demo:**
  1. Buka form penerimaan panen.
  2. Tunjukkan bagaimana petugas memilih Petani `MBR-001 (Budi Santoso)`.
  3. Masukkan komoditas: `Cabai Merah Keriting`, Berat Kotor `1.020 kg`, Tarra `20 kg` → Sistem otomatis menghitung Netto **1.000 kg**.
  4. Klik Simpan. Tunjukkan terbitnya **Nomor Batch Unik** (misal: `BATCH-20261118-001`).
* **Narasi ke Dosen:**
  > *"Pada modul Procurement ini, hasil panen ditimbang secara objektif. Sistem langsung menerbitkan **Nomor Batch Unik**. Batch ini yang menjadi jangkar **Traceability** dari hulu hingga hilir, memastikan setiap gram cabai dapat dilacak kebun asalnya."*

---

### BABAK 3: Sortasi, Grading & Validasi Keseimbangan Massa (*Highlight Utama*)
* **Aktor / Login:** Petugas Sortasi (`sortasi` / `password123`)
* **Halaman:** `/production/sorting`
* **Aksi Demo (*The Killer Feature*):**
  1. Pilih penerimaan panen 1.000 kg yang tadi diterima.
  2. **Tunjukkan Validasi Error Dulu (Demo Proteksi):**
     * Input Grade A: 700 kg, Grade B: 200 kg, Afkir: 90 kg (Total = 990 kg, selisih 10 kg).
     * Tunjukkan peringatan merah sistem: *"Keseimbangan massa tidak terpenuhi. Selisih 10 kg!"*
     * Jelaskan bahwa tombol Simpan terkunci.
  3. **Perbaiki Input:**
     * Ubah Afkir menjadi 100 kg (Total = 1.000 kg, Selisih = 0 kg).
     * Klik Konfirmasi & Posting.
* **Narasi ke Dosen:**
  > *"Di sinilah kami menerapkan prinsip **Quality Management** dan hukum fisika **Mass Balance ($W_{input} = W_{A} + W_{B} + W_{C} + W_{afkir}$)**. Sistem kami memiliki mekanisme **Internal Control**: petugas tidak bisa menyimpan data jika ada selisih berat bahkan hanya 1 kg. Ini mencegah manipulasi timbangan, pencurian terselubung, dan susut yang tidak teridentifikasi (*shrinkage*)."*

---

### BABAK 4: Manajemen Stok Gudang & Penegakan FIFO
* **Aktor / Login:** Admin Gudang (`gudang` / `password123`)
* **Halaman:** `/inventory/stock`
* **Aksi Demo:**
  1. Tunjukkan Tab **Stok Barang Jadi (GD-JADI)**.
  2. Perlihatkan bahwa stok Grade A (700 kg) dan Grade B (200 kg) langsung masuk secara *real-time* dengan label batch yang sama.
  3. Tunjukkan Tab **Stok Saprotan & Peringatan ROP (Reorder Point)**:
     * Perlihatkan indikator status aman vs peringatan minimum stok pupuk/benih.
* **Narasi ke Dosen:**
  > *"Di modul Inventory, kita melihat penerapan **Inventory Control & FIFO**. Hasil sortasi otomatis menambah saldo stok siap jual per batch tanggal kedaluwarsa. Selain itu, sistem memantau batas **Reorder Point (ROP)** pupuk agar koperasi tidak pernah mengalami stockout maupun overstock."*

---

### BABAK 5: Pesanan Penjualan & Penerbitan Surat Jalan
* **Aktor / Login:** Bagian Penjualan (`penjualan` / `password123`)
* **Halaman:** `/sales/orders`
* **Aksi Demo:**
  1. Buat pesanan penjualan baru:
     * Pelanggan: `Toko Sayur Segar Jaya` (Segmen Retail).
     * Rincian: Cabai Grade A (700 kg @ Rp 45.000) dan Grade B (200 kg @ Rp 39.500).
     * Total Transaksi: **Rp 39.400.000**.
  2. Tunjukkan alokasi stok otomatis mengambil batch tertua (FIFO).
  3. Konfirmasi Pesanan dan klik tombol **Surat Jalan**.
  4. Tunjukkan modal / cetak Surat Jalan resmi yang memuat No. DO, daftar batch, dan jumlah kirim.
* **Narasi ke Dosen:**
  > *"Pada modul Sales, sistem mendukung harga berjenjang antar-segmen (retail vs horeka). Saat pesanan dibuat, sistem otomatis mereservasi stok dengan prinsip FIFO, memotong inventaris gudang, dan menerbitkan dokumen resmi Surat Jalan Delivery Order."*

---

### BABAK 6: Akuntansi Otomatis (Auto-Journaling) & Transparansi SHU
* **Aktor / Login:** Bagian Keuangan (`keuangan` / `password123`)
* **Halaman:** `/accounting`
* **Aksi Demo:**
  1. **Tab 1 (Buku Jurnal Umum):** Tunjukkan jurnal otomatis ganda (*double-entry*) yang tercipta dari penerimaan panen dan penjualan tanpa perlu input manual oleh akuntan.
  2. **Tab 2 (Laba Rugi & Margin):** Tunjukkan Pendapatan Rp 39.400.000, HPP Rp 32.600.000, Laba Kotor **Rp 6.800.000 (Margin 17,26%)**.
  3. **Tab 3 (Kalkulator SHU):**
     * Klik tombol **Hitung Pembagian SHU Anggota**.
     * Tunjukkan kartu alokasi AD/ART (Dana Cadangan 40%, Jasa Usaha 25%, Jasa Modal 20%, Sosial 15%) dan tabel distribusi keuntungan per petani anggota.
* **Narasi ke Dosen:**
  > *"Ini keunggulan integrasi finansial: **Auto-Journaling**. Petugas operasional di lapangan tidak perlu paham debet-kredit; setiap pergerakan barang otomatis membukukan jurnal akuntansi yang presisi. Di Tab 3, Sisa Hasil Usaha (SHU) dibagikan secara transparan dan proporsional berdasarkan kontribusi riil transaksi anggota sesuai AD/ART koperasi."*

---

### BABAK 7: Laporan Eksekutif, ESG, & Ketertelusuran Pangan (SDGs)
* **Aktor / Login:** Pengurus Koperasi (`pengurus` / `password123`)
* **Halaman:** `/reports/esg`
* **Aksi Demo:**
  1. Tunjukkan Dashboard ESG 3 Pilar:
     * **Pilar Environmental:** Rasio pupuk organik vs kimia, persentase susut panen (*food loss ratio*).
     * **Pilar Social:** Keadilan harga petani (*farmer share margin*), ketepatan pembayaran.
     * **Pilar Governance:** Ketertelusuran batch 100% dan transparansi tata kelola.
  2. **Fitur Traceability Check:** Masukkan kode batch panen (`BATCH-20261118-001`), klik lacak → Tunjukkan riwayat lengkap: Petani asal, tanggal panen, hasil sortasi, hingga nomor Surat Jalan pengiriman ke konsumen.
* **Narasi Penutup ke Dosen:**
  > *"Terakhir, sebagai wujud **Sustainable Operations Management**, pimpinan koperasi dapat memantau indikator ESG dan SDGs (Zero Hunger & Responsible Consumption). Melalui fitur Traceability, jika konsumen pasar modern mengklaim ada komoditas cacat, koperasi dapat melacaknya kembali 100% hingga ke petak lahan petani asalnya dalam hitungan detik."*

---

## 💡 TIPS MENGHADAPI PERTANYAAN KRITIS DOSEN

| Pertanyaan Dosen | Kunci Jawaban Singkat & Berbobot |
| :--- | :--- |
| *"Apa bedanya sistem ini dengan pencatatan Excel biasa?"* | **Excel tidak memiliki *Process Integration* dan *Enforced Controls*.** Di Excel, orang bisa salah ketik tanpa validasi, data antar-bagian bisa beda versi (*multiple versions of truth*), dan tidak ada pembatasan hak akses (*RBAC*) serta jejak audit otomatis. |
| *"Mengapa memilih metode FIFO daripada LIFO/Average?"* | **Karakteristik komoditas pertanian adalah *perishable* (mudah susut/rusak).** Barang yang masuk lebih awal harus keluar lebih awal agar tidak membusuk di gudang, meminimalkan kerugian *spoilage*, dan menjaga kesegaran bagi konsumen. |
| *"Bagaimana sistem menjamin keadilan bagi petani kecil?"* | Melalui **standarisasi mutu grading bertingkat** (Grade A dihargai lebih tinggi secara objektif, bukan taksiran sepihak tengkulak) dan **pembagian SHU berbasis transaksi nyata** yang tercatat otomatis di sistem. |
