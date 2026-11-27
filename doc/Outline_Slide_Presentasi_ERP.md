# OUTLINE SLIDE PRESENTASI: SMART FARMING ERP CORE
**Kelompok 3 | Total Durasi: 10 Menit (5 Pembicara @ ~2 Menit) | Target Asesor: Teknis & ERP Specialist**

---

## DISTRIBUSI WAKTU & URUTAN PEMBICARA

1. **Pancar (00:00 - 00:30)** : Opening & Pengenalan Tim (Slide 1)
2. **Rani (00:30 - 01:30)** : Problem Statement & Urgensi ERP (Slide 2)
3. **Aufa (01:30 - 03:30)** : Arsitektur 7 Modul, Logika Rantai Pasok & Hardware (Slide 3)
4. **Pancar (03:30 - 05:30)** : Fondasi Basis Data 3NF, Jurnal Otomatis & Netting Piutang (Slide 4 & Slide 5)
5. **Rani (05:30 - 06:30)** : Kerangka Core Frontend & Otorisasi RBAC UI (Slide 6)
6. **Caca (06:30 - 08:00)** : UI/UX Lapangan, Timbangan Digital & Mass Balance (Slide 7)
7. **Amel (08:00 - 09:30)** : Reporting PDF/Excel, Dashboard ESG & Validasi Pengujian/SUS (Slide 8)
8. **Pancar (09:30 - 10:00)** : Kesimpulan & Transisi ke Live Demo Sesi Q&A (Slide 8 Closing)

---

## DETAIL SLIDE & POIN HIGHLIGHT

### SLIDE 1: JUDUL & IDENTITAS TIM (0.5 Menit) - *Pembicara: Pancar*
* **Judul:** SMART FARMING ERP CORE
* **Sub-judul:** Solusi Sistem Enterprise Terintegrasi untuk Ekosistem Agribisnis & Koperasi Pertanian
* **Poin Identitas Tim & Tupoksi:**
  * **Pancar** – Project Lead / Lead Backend & Database Architect
  * **Aufa** – Backend Engineer & Hardware Integration
  * **Rani** – Lead Frontend Developer & Document Lead
  * **Caca** – Frontend UI/UX & Field Operations Specialist
  * **Amel** – Quality Assurance, Reporting & UAT Lead
* **Highlight:** *Membangun fondasi ERP terintegrasi hulu-ke-hilir berbasis Single Source of Truth (SSOT).*

---

### SLIDE 2: PROBLEM STATEMENT (1.0 Menit) - *Pembicara: Rani*
* **Judul:** TANTANGAN OPERASIONAL & FINANSIAL AGRIBISNIS
* **Sub-judul:** Mengapa Koperasi Pertanian Membutuhkan Sistem Terpadu?
* **Poin Highlight (3 Pain Points):**
  * **Silo Data Operasional:** Pencatatan lahan, hasil panen, dan gudang terpisah $\rightarrow$ rawan selisih dan manipulasi data.
  * **Keterlambatan Pembukuan:** Transaksi fisik tidak langsung terjurnal $\rightarrow$ laporan keuangan bulanan terlambat.
  * **Piutang Saprotan Macet:** Petani mengambil pupuk/bibit secara kredit, namun gagal dipotong saat hasil panen disetor.
* **Value Proposition:** *Integrasi SSOT mengunci alur operasional fisik langsung ke pembukuan finansial real-time.*

---

### SLIDE 3: ARSITEKTUR SOLUSI & RANTAI PASOK (2.0 Menit) - *Pembicara: Aufa*
* **Judul:** ARSITEKTUR SISTEM & SUPPLY CHAIN ENGINE
* **Sub-judul:** End-to-End Enterprise Flow dari Hulu ke Hilir
* **Poin Highlight:**
  * **7 Modul Terintegrasi:** Keanggotaan $\rightarrow$ Farming Batch $\rightarrow$ Harvest Intake $\rightarrow$ Gudang $\rightarrow$ POS Saprotan $\rightarrow$ Sales B2B $\rightarrow$ Akuntansi/GL.
  * **Logika Rantai Pasok (Backend):**
    * Algoritma **FIFO (First-In, First-Out)** pada perputaran inventori barang jadi.
    * **Mass Balance Constraint:** Total berat curah panen mutlak sama dengan total output mutu (A+B+C) + afkir.
  * **Integrasi Hardware Periferal:**
    * Web Serial API untuk pembacaan real-time timbangan digital.
    * USB HID untuk pemindaian barcode lot gudang.

---

### SLIDE 4: FONDASI BASIS DATA & INTEGRITAS RELASIONAL (1.0 Menit) - *Pembicara: Pancar*
* **Judul:** ARSITEKTUR BASIS DATA & INTEGRITAS ACID
* **Sub-judul:** Menjamin Validitas & Konsistensi Data Enterprise
* **Poin Highlight:**
  * **Normalisasi 3NF:** Eliminasi redundansi dan anomali pembaruan pada PostgreSQL 14 (12 skrip migrasi SQL).
  * **Strict Referential Integrity:** Penegakan `FOREIGN KEY ... ON DELETE RESTRICT` $\rightarrow$ bebas *orphan records*.
  * **Akurasi Moneter:** Tipe data `DECIMAL(15,2)` (menghindari cacat presisi `FLOAT`).
  * **Optimasi Query:** Indeks B-Tree pada foreign keys, status transaksi, tanggal, dan NIK anggota.

---

### SLIDE 5: FINANCIAL CORE: JURNAL OTOMATIS & NETTING (1.0 Menit) - *Pembicara: Pancar [HIGHLIGHT UTAMA]*
* **Judul:** INTEGRASI FINANSIAL: SUBLEDGER TO GENERAL LEDGER
* **Sub-judul:** Otomatisasi Pembukuan & Aturan Bisnis Koperasi (BR-07)
* **Poin Highlight:**
  * **Real-time Auto-Journaling:**
    * Mutasi panen masuk seketika membukukan [D] Persediaan Panen vs [K] Hutang Anggota.
    * Penjualan B2B membukukan [D] Piutang Usaha vs [K] Pendapatan Penjualan.
  * **Keseimbangan Atomik:** Validasi transaksi $\sum \text{Debit} == \sum \text{Kredit}$. Selisih Rp1 langsung auto-`ROLLBACK`.
  * **Business Rule BR-07 (Netting Payable):** Pemotongan otomatis sisa piutang saprotan dari hasil penjualan panen petani.
  * **Laba/Rugi per Batch & Akumulasi Sisa Hasil Usaha (SHU)** tersaji otomatis.

---

### SLIDE 6: CORE FRONTEND & TATA KELOLA RBAC (1.0 Menit) - *Pembicara: Rani*
* **Judul:** ARSITEKTUR FRONTEND & KONTROL INTERNAL (RBAC)
* **Sub-judul:** Single Page Application & Segregation of Duties (SoD)
* **Poin Highlight:**
  * **Core SPA Architecture:** React 18, Vite, Tailwind CSS dengan dynamic navigation sidebar menyesuaikan hak akses pengguna.
  * **Segregation of Duties (SoD) Implementation:**
    * Pembatasan peran ketat: Petugas Lapangan, Petugas Gudang, Kasir, Akuntan, dan Manajer.
    * Kasir tidak bisa mengubah stok gudang; Petugas lapangan dilarang mengakses modul kas.
  * **Price Tiering Engine (Sales Order):** Penguncian harga jual bertingkat otomatis berdasarkan segmentasi pelanggan B2B.

---

### SLIDE 7: UI/UX LAPANGAN, TIMBANGAN & MASS BALANCE (1.5 Menit) - *Pembicara: Caca*
* **Judul:** ANTARMUKA LAPANGAN & REAL-TIME MASS BALANCE
* **Sub-judul:** Desain Ergonomis Operasional Gudang & Sortasi Panen
* **Poin Highlight:**
  * **Touch-Friendly UI:** Antarmuka penerimaan panen dioptimalkan untuk layar sentuh gudang dengan tombol aksi besar.
  * **One-Click "Ambil Berat":** Integrasi tombol UI langsung membaca stream data timbangan digital tanpa ketik manual.
  * **Real-time Mass Balance Calculator:** Indikator visual interaktif saat sortasi (berubah hijau jika massa seimbang, merah jika tidak imbang).
  * **Resilience UX:** Penanganan error kontekstual, peringatan restock, dan *Auto-Save Draft* via Browser Local Storage.

---

### SLIDE 8: REPORTING, ESG, VALIDASI PENGUJIAN & PENUTUP (2.0 Menit) - *Pembicara: Amel & Pancar*
* **Judul:** REPORTING, ESG & VALIDASI SISTEM
* **Sub-judul:** Kesiapan Enterprise, Akuntabilitas & Penutup
* **Poin Highlight (Amel):**
  * **Automated Document Generator:** Rendering instan format PDF (Bukti Timbang, Surat Jalan, Faktur Penjualan) & ekspor Excel (.xlsx).
  * **Dashboard ESG & Traceability:** Visualisasi metrik food loss, rasio pupuk organik, dan jejak rantai pasok dari meja ke kebun.
  * **Hasil Pengujian Sistem:**
    * **Usability Testing (SUS):** Skor **79.25** (*Grade B / Good Category*). Task Completion Rate **100%**.
    * **Pengujian Fungsional (UAT):** 100% dari skenario uji bisnis (anti-stok negatif, jurnal immutable) lolos validasi.
* **Closing Statement (Pancar - 30 Detik):**
  * *"Sistem Smart Farming ERP Core telah aktif dan siap diuji. Kami membuka sesi tanya jawab dan siap mendemonstrasikan sistem secara langsung."*
